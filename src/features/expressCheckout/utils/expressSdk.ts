import { PayoneerSDKUtils } from "@/features/embeddedCheckout/utils/payoneerSdk";
import { CheckoutApiService } from "@/services/checkoutApi";
import { buildListSessionUpdates } from "@/features/embeddedCheckout/utils/checkoutUtils";
import { detectLocalServers } from "@/utils/localServerDetection";
import type { LocalModeConfig } from "@/features/embeddedCheckout/constants/checkout";
import type { CheckoutInstance, CheckoutInstanceConfig } from "@/features/embeddedCheckout/types/checkout";
import type { MerchantCart } from "@/types/merchant";
import type { Book } from "@/features/expressCheckout/types/express";
import type { ExpressConfig } from "@/features/expressCheckout/constants/express";
import { DEMO_BILLING, DEMO_SHIPPING } from "@/features/expressCheckout/constants/express";
import type { OnSubmitSuccess, OnSubmitError } from "@/features/expressCheckout/types/express";

async function resolveLocalMode(): Promise<LocalModeConfig> {
  const status = await detectLocalServers();
  return {
    enabled: true,
    checkoutWebAvailable: status.checkoutWeb,
    checkoutWebStripeAvailable: status.checkoutWebStripe,
  };
}

export interface ExpressSession {
  longId: string;
  paymentReference: string;
}

/** Creates a LIST session for the selected book x quantity using the demo identity. */
export async function createExpressSession(
  config: ExpressConfig,
  book: Book,
  quantity: number,
  currency: string
): Promise<ExpressSession> {
  const cart: MerchantCart = {
    products: [{ name: book.title, price: book.price, quantity }],
    currency,
  };
  const billing = { ...DEMO_BILLING, country: config.country };
  const shipping = { ...DEMO_SHIPPING, country: config.country };
  const request = buildListSessionUpdates(cart, billing, shipping, true, config.env);
  const response = await CheckoutApiService.generateListSession(request, config.env);
  return { longId: response.id, paymentReference: request.payment.reference };
}

export interface InitExpressParams {
  config: ExpressConfig;
  longId: string;
  onSubmitSuccess: OnSubmitSuccess;
  onSubmitError: OnSubmitError;
}

/** Loads the SDK (local-mode aware) and initialises a CheckoutWeb instance with express config.
 *  Unlike the embedded initCheckout, no onComponentListChange binding — express uses the event bus. */
export async function initExpressCheckout(params: InitExpressParams): Promise<CheckoutInstance> {
  const { config, longId, onSubmitSuccess, onSubmitError } = params;
  const localMode = await resolveLocalMode();
  const loaded = await PayoneerSDKUtils.loadCheckoutWeb(config.env, localMode);
  if (!loaded || !window.Payoneer?.CheckoutWeb) {
    throw new Error("Failed to load Checkout Web SDK");
  }

  const checkoutConfig: Partial<CheckoutInstanceConfig> = {
    longId,
    env: config.env,
    // No preload: `dropIn('express')` loads its own script chain on mount. Preloading "express"
    // is unnecessary and, under walletMode 'inline', CheckoutWeb logs an "unknown method" error
    // breadcrumb (verified in checkout-web CheckoutWeb.ts preInitScript) — avoid the noise.
    preload: [],
    walletMode: config.walletMode,
    expressWallets: config.expressWallets,
    expressOperationType: config.expressOperationType,
    onSubmitSuccess,
    onSubmitError,
  };

  return window.Payoneer.CheckoutWeb(checkoutConfig as CheckoutInstanceConfig);
}
