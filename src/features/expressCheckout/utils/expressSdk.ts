import { PayoneerSDKUtils } from "@/features/embeddedCheckout/utils/payoneerSdk";
import { CheckoutApiService } from "@/services/checkoutApi";
import { buildListSessionUpdates } from "@/features/embeddedCheckout/utils/checkoutUtils";
import { detectLocalServers } from "@/utils/localServerDetection";
import type { LocalModeConfig } from "@/features/embeddedCheckout/constants/checkout";
import type {
  CheckoutInstance,
  ComponentListDiff,
  OnReadyHandler,
} from "@/features/embeddedCheckout/types/checkout";
import type { MerchantCart } from "@/types/merchant";
import type { ExpressConfig } from "@/features/expressCheckout/constants/express";
import { DEMO_SHIPPING } from "@/features/expressCheckout/constants/express";
import type { CartItem } from "@/features/expressCheckout/store/expressCartStore";
import type { BuyerForm } from "@/features/expressCheckout/store/expressBuyerStore";
import { billingFromBuyer } from "@/features/expressCheckout/store/expressBuyerStore";
import { buildCardListProducts } from "@/features/expressCheckout/utils/cardTotals";
import { buildExpressBeforeSubmit } from "@/features/expressCheckout/units/expressElement";
import type {
  ExpressInitConfig,
  OnSubmitSuccess,
  OnSubmitError,
} from "@/features/expressCheckout/types/express";

// Local-server detection is environment-static for the life of the tab (the dev servers don't come
// and go mid-session) yet it fires two HEAD probes. Cache the result so every express build - and the
// warm-up below - share ONE detection instead of re-probing on each mount. Reload to re-detect if you
// start the local servers after the app.
let localModePromise: Promise<LocalModeConfig> | null = null;

export function resolveLocalMode(): Promise<LocalModeConfig> {
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
// express element a shopper opens - book detail or checkout - doesn't pay the script-download cost
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
      // Ignore - the actual initCheckout will report any load error when the user opens a page.
    }
  })();
}

/** The card LIST a checkout surface pays against. */
export interface CardListSession {
  longId: string;
  transactionId: string;
}

function cardListRequest(
  config: ExpressConfig,
  items: CartItem[],
  currency: string,
  buyer: BuyerForm
) {
  const products = buildCardListProducts(items, buyer.country);
  const cart: MerchantCart = { products, currency };
  const billing = billingFromBuyer(buyer);
  const shipping = {
    ...DEMO_SHIPPING,
    firstName: billing.firstName,
    lastName: billing.lastName,
    country: billing.country,
  };
  // The LIST country stays the shop's (config) country: OPG picks the card form language from it at
  // creation, and in-place updates can't change it. The buyer's country rides the addresses only.
  return { ...buildListSessionUpdates(cart, billing, shipping, true, config.env), country: config.country };
}

/**
 * Creates a LIST session for the card drop-in: the committed buyer form drives billing, and the book
 * lines carry the est. tax (see `buildCardListProducts`). Card-only; the express wallet amount never
 * reads this total (it stays tax-free, see `useCheckoutSession`).
 */
export async function createExpressSession(
  config: ExpressConfig,
  items: CartItem[],
  currency: string,
  buyer: BuyerForm
): Promise<CardListSession> {
  const request = {
    ...cardListRequest(config, items, currency, buyer),
    preselection: { deferral: config.cardDeferral },
  };
  const response = await CheckoutApiService.generateListSession(request, config.env);
  return { longId: response.id, transactionId: response.transactionId };
}

/**
 * Re-sends billing and the tax-bearing lines for a new committed buyer to the existing LIST. The
 * caller then refreshes the instance with `updateLongId`, so neither drop-in remounts.
 */
export async function updateCardListSession(
  config: ExpressConfig,
  session: CardListSession,
  items: CartItem[],
  currency: string,
  buyer: BuyerForm
): Promise<void> {
  const response = await CheckoutApiService.updateListSession(
    session.longId,
    { ...cardListRequest(config, items, currency, buyer), transactionId: session.transactionId },
    config.env
  );
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
}

export interface InitCheckoutParams {
  config: ExpressConfig;
  // Optional: a CARD surface needs a LIST session (the classic drop-in resolves its methods from the
  // LIST), so it passes a `longId`. An EXPRESS-ONLY surface does not - `dropIn('express')` resolves
  // from the express component's own method key (no provider/LIST lookup), so it inits without one and
  // never calls POST /checkout/session.
  longId?: string;
  onSubmitSuccess: OnSubmitSuccess;
  onSubmitError: OnSubmitError;
  // Card-only signals - omitted for express-only surfaces (e.g. the book-detail buy-now).
  onComponentListChange?: (checkout: CheckoutInstance, diff: ComponentListDiff) => void;
  onReady?: OnReadyHandler;
  // Warm the card component. False on express-only surfaces so we don't preload a component we
  // never mount. Defaults to true (the checkout page).
  preloadCards?: boolean;
  // Pre-charge gate for the card drop-in (non-express components). Proceeds when omitted.
  cardBeforeSubmit?: () => Promise<boolean>;
}

/**
 * Loads the SDK (local-mode aware) and initialises ONE CheckoutWeb instance that hosts BOTH the
 * express wallet element and the classic card drop-in.
 *
 * Why a single instance: it is the recommended integration model. `env`, `clientId`, `country`
 * and `walletMode` are page-wide settings that a second instance would have to repeat exactly
 * (e.g. a card instance without `walletMode: 'express'` can show its own Google Pay tab next to
 * the Express button). A second instance is harmless (each Stripe account gets its own Stripe
 * instance, and with a checkout-web that includes PCPAY-5965, Stripe.js and the SDK scripts load
 * once per page) but never needed.
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
    cardBeforeSubmit,
  } = params;
  const localMode = await resolveLocalMode();
  const loaded = await PayoneerSDKUtils.loadCheckoutWeb(config.env, localMode);
  if (!loaded || !window.Payoneer?.CheckoutWeb) {
    throw new Error("Failed to load Checkout Web SDK");
  }

  const checkoutConfig: ExpressInitConfig = {
    // Undefined on an express-only surface (no LIST session); the SDK config treats `longId` as
    // optional and resolves dropIn('express') without it.
    longId,
    env: config.env,
    // Express identity is declared once at init (like the card flow's longId), not on the
    // per-transaction dropIn('express') call. The SDK reads them for the GET /express fetch and
    // charge-URL stamping.
    clientId: config.clientId,
    country: config.country,
    // Warm the card component only when a card drop-in will actually be mounted; dropIn('express')
    // loads its own chain on mount (preloading "express" logs an "unknown method" breadcrumb).
    preload: preloadCards ? ["stripe:cards"] : [],
    walletMode: config.walletMode,
    expressWallets: config.expressWallets,
    expressOperationType: config.expressOperationType,
    ...(config.expressDeferral === "DEFERRED" && { expressDeferral: config.expressDeferral }),
    onComponentListChange,
    // Public "ready" signal: fires when the card form has actually rendered (Stripe
    // PaymentElement `ready`), not merely when the element is attached to the DOM.
    onReady,
    onSubmitSuccess,
    onSubmitError,
    // Express pre-charge gate (QA): attached unconditionally but a transparent proceed unless the config
    // sheet enables it. The callback reads live config + gates only the express component, so toggling the
    // outcome/delay applies on the next confirm without a re-init (it is not in `reinitSignatureOf`).
    onBeforeSubmit: buildExpressBeforeSubmit(cardBeforeSubmit),
  };

  return window.Payoneer.CheckoutWeb(checkoutConfig);
}
