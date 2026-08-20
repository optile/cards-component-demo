import { PayoneerSDKUtils } from "@/features/embeddedCheckout/utils/payoneerSdk";
import { CheckoutApiService } from "@/services/checkoutApi";
import { buildListSessionUpdates } from "@/features/embeddedCheckout/utils/checkoutUtils";
import { detectLocalServers } from "@/utils/localServerDetection";
import type { LocalModeConfig } from "@/features/embeddedCheckout/constants/checkout";
import type {
  CheckoutInstance,
  CheckoutInstanceConfig,
  ComponentListDiff,
  ReadyEventData,
} from "@/features/embeddedCheckout/types/checkout";
import type { MerchantCart } from "@/types/merchant";
import type { ExpressConfig } from "@/features/expressCheckout/constants/express";
import { DEMO_BILLING, DEMO_SHIPPING } from "@/features/expressCheckout/constants/express";
import type { CartItem } from "@/features/expressCheckout/store/expressCartStore";
import { shippingOf } from "@/features/expressCheckout/store/expressCartStore";
import type { OnSubmitSuccess, OnSubmitError } from "@/features/expressCheckout/types/express";

// Local-server detection is environment-static for the life of the tab (the dev servers don't come
// and go mid-session) yet it fires two HEAD probes. Cache the result so every express build — and the
// warm-up below — share ONE detection instead of re-probing on each mount. Reload to re-detect if you
// start the local servers after the app.
let localModePromise: Promise<LocalModeConfig> | null = null;

function resolveLocalMode(): Promise<LocalModeConfig> {
  localModePromise ??= (async () => {
    const status = await detectLocalServers();
    return {
      enabled: true,
      checkoutWebAvailable: status.checkoutWeb,
      checkoutWebStripeAvailable: status.checkoutWebStripe,
    };
  })();
  return localModePromise;
}

// Preload the checkout-web SDK bundle (and install the fetch override) ahead of time so the first
// express element a shopper opens — book detail or checkout — doesn't pay the script-download cost
// inline. Idempotent: `loadCheckoutWeb` no-ops once the SDK is on `window`, the detection promise is
// shared, and the warm runs at most once. Fire-and-forget; any load error is surfaced later by the
// real `initCheckout`. Call it when the storefront mounts.
let warmPromise: Promise<void> | null = null;

export function warmCheckoutWeb(env: string): void {
  warmPromise ??= (async () => {
    try {
      const localMode = await resolveLocalMode();
      await PayoneerSDKUtils.loadCheckoutWeb(env, localMode);
    } catch {
      // Ignore — the actual initCheckout will report any load error when the user opens a page.
    }
  })();
}

/** Creates a LIST session for the whole cart (order total) using the demo identity. */
export async function createExpressSession(
  config: ExpressConfig,
  items: CartItem[],
  currency: string
): Promise<{ longId: string }> {
  const products = items.map((i) => ({ name: i.title, price: i.price, quantity: i.quantity }));
  // Add shipping as a line item so the LIST session total matches the displayed order total.
  const shippingFee = shippingOf(items);
  if (shippingFee > 0) products.push({ name: "Shipping", price: shippingFee, quantity: 1 });
  const cart: MerchantCart = { products, currency };
  const billing = { ...DEMO_BILLING, country: config.country };
  const shipping = { ...DEMO_SHIPPING, country: config.country };
  const request = buildListSessionUpdates(cart, billing, shipping, true, config.env);
  const response = await CheckoutApiService.generateListSession(request, config.env);
  return { longId: response.id };
}

export interface InitCheckoutParams {
  config: ExpressConfig;
  longId: string;
  onSubmitSuccess: OnSubmitSuccess;
  onSubmitError: OnSubmitError;
  // Card-only signals — omitted for express-only surfaces (e.g. the book-detail buy-now).
  onComponentListChange?: (checkout: CheckoutInstance, diff: ComponentListDiff) => void;
  onReady?: (componentName: string, data: ReadyEventData) => void;
  // Warm the card component. False on express-only surfaces so we don't preload a component we
  // never mount. Defaults to true (the checkout page).
  preloadCards?: boolean;
}

/**
 * Loads the SDK (local-mode aware) and initialises ONE CheckoutWeb instance that hosts BOTH the
 * express wallet element and the classic card drop-in.
 *
 * Why a single instance: the SDK's Stripe layer exposes a module-level singleton Stripe instance
 * that binds to the FIRST caller's publishable key + connected account and
 * returns that same Stripe object to everyone after. Running two CheckoutWeb instances (one per
 * component) therefore loads Stripe.js twice and makes the express ECE and the card element fight
 * over that singleton — the ECE ends up on the wrong account and reports no wallet, so Google Pay
 * never renders. One instance = one Stripe.js load = one shared instance for the same session, which
 * is also how a real merchant integration mounts multiple drop-ins.
 *
 * `preload: ['stripe:cards']` warms the card component; `dropIn('express')` loads its own chain on
 * mount (preloading "express" is unnecessary and logs an "unknown method" breadcrumb under some
 * walletModes). `onComponentListChange` signals when `cards` is mountable; `onReady` fires when the
 * card form has actually rendered (Stripe PaymentElement `ready`).
 */
export async function initCheckout(params: InitCheckoutParams): Promise<CheckoutInstance> {
  const {
    config,
    longId,
    onSubmitSuccess,
    onSubmitError,
    onComponentListChange,
    onReady,
    preloadCards = true,
  } = params;
  const localMode = await resolveLocalMode();
  const loaded = await PayoneerSDKUtils.loadCheckoutWeb(config.env, localMode);
  if (!loaded || !window.Payoneer?.CheckoutWeb) {
    throw new Error("Failed to load Checkout Web SDK");
  }

  const checkoutConfig: CheckoutInstanceConfig = {
    longId,
    env: config.env,
    // Warm the card component only when a card drop-in will actually be mounted; dropIn('express')
    // loads its own chain on mount (preloading "express" logs an "unknown method" breadcrumb).
    preload: preloadCards ? ["stripe:cards"] : [],
    walletMode: config.walletMode,
    expressWallets: config.expressWallets,
    expressOperationType: config.expressOperationType,
    onComponentListChange,
    // Public "ready" signal: fires when the card form has actually rendered (Stripe
    // PaymentElement `ready`), not merely when the element is attached to the DOM.
    onReady,
    onSubmitSuccess,
    onSubmitError,
  };

  return window.Payoneer.CheckoutWeb(checkoutConfig);
}
