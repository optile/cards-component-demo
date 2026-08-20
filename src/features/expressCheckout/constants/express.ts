import type { BillingAddress, ShippingAddress } from "@/types/merchant";
import {
  type EnvName,
  type ExpressOperationType,
  type ExpressWalletsConfig,
  type WalletMode,
} from "@/features/expressCheckout/types/express";

// Hardcoded demo identity feeding buildListSessionUpdates. Synthetic data only (no real PII).
export const DEMO_BILLING: BillingAddress = {
  firstName: "Ada", lastName: "Reader", email: "ada.reader@example.test", phone: "",
  street: "12 Paper Row", houseNumber: "3", zip: "10001", city: "New York",
  state: "NY", country: "US", birthday: "1990-01-01",
};

export const DEMO_SHIPPING: ShippingAddress = {
  firstName: "Ada", lastName: "Reader", phone: "",
  street: "12 Paper Row", houseNumber: "3", zip: "10001", city: "New York",
  state: "NY", country: "US", birthday: "1990-01-01",
};

export interface ExpressConfig {
  env: EnvName;
  clientId: string;
  country: string;
  locale: string;
  walletMode: WalletMode;
  expressWallets: ExpressWalletsConfig;
  expressOperationType: ExpressOperationType;
  allowRealRedirect: boolean;
}

/**
 * Init-affecting slice of the config: changing any of these means CheckoutWeb must be re-initialised
 * (a fresh LIST session). Single source shared by the prefetch key (expressPrefetch) and the live
 * rebuild key (useCheckoutSession) so the two identities can never drift out of sync.
 */
export function reinitSignatureOf(config: ExpressConfig): string {
  return [
    config.env,
    config.walletMode,
    config.expressWallets.applePay,
    config.expressWallets.googlePay,
    config.expressOperationType,
  ].join("|");
}

// Public merchant-application token from the checkout-web-stripe express.html BE integration
// sample (public, not a secret — the backend validates clientId server-side). Baked in so the
// demo works out of the box; override via VITE_EXPRESS_CLIENT_ID or the config sheet.
const DEMO_EXPRESS_CLIENT_ID = "v1.opt-div-app.0c7ce5154758454fb6a8dc49a72c04f4";

export function getDefaultClientId(): string {
  return import.meta.env.VITE_EXPRESS_CLIENT_ID || DEMO_EXPRESS_CLIENT_ID;
}

// A LIST session left idle past this is likely expired server-side. Shared by the live keep-alive
// staleness guard (useCheckoutSession) and the prefetch cache (expressPrefetch) so both age sessions
// out on the same clock. Kept comfortably below the backend session lifetime.
export const SESSION_TTL_MS = 15 * 60 * 1000;

export const DEFAULT_EXPRESS_CONFIG: ExpressConfig = {
  // Cards use this env (has a Divisions entry → LIST resolves). The SDK derives the GET /express host
  // from this same `env`; the demo's fetch shim + vite `/opg-proxy` (OPG_PROXY_TARGET, default ramy)
  // route that call to wherever the express clientId is provisioned. Both surfaces coexist because
  // checkout-web-stripe caches a Stripe instance per account.
  env: "checkout.integration",
  clientId: getDefaultClientId(),
  country: "US",
  locale: "en_US",
  walletMode: "both",
  expressWallets: { applePay: "auto", googlePay: "auto" },
  expressOperationType: "charge",
  allowRealRedirect: false,
};
