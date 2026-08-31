import type { BillingAddress, ShippingAddress } from "@/types/merchant";
import {
  type EnvName,
  type ExpressOperationType,
  type ExpressWalletsConfig,
  type WalletMode,
} from "@/features/expressCheckout/types/express";

// Hardcoded demo identity feeding buildListSessionUpdates. Synthetic data only (no real PII).
export const DEMO_BILLING: BillingAddress = {
  firstName: "Ada",
  lastName: "Reader",
  email: "ada.reader@example.test",
  phone: "",
  street: "12 Paper Row",
  houseNumber: "3",
  zip: "10001",
  city: "New York",
  state: "NY",
  country: "US",
  birthday: "1990-01-01",
};

export const DEMO_SHIPPING: ShippingAddress = {
  firstName: "Ada",
  lastName: "Reader",
  phone: "",
  street: "12 Paper Row",
  houseNumber: "3",
  zip: "10001",
  city: "New York",
  state: "NY",
  country: "US",
  birthday: "1990-01-01",
};

/**
 * One ECE shipping RATE offered on the `dropIn('express')` call. `amount` is a MAJOR-unit decimal
 * string in the charge currency (e.g. `'9.99'`, `'0'`) — the SDK converts to Stripe minor units.
 *
 * NOTE — three "shipping" concepts in this demo, don't conflate them: (1) the cart flat/free fee
 * (`shippingOf`: $5 / free over $50), charged on the card path and on express when ECE rates are OFF;
 * (2) `DEMO_SHIPPING`, the synthetic LIST shipping ADDRESS above (an address, not a charge); (3) these
 * ECE rates — when on they REPLACE (1) for the express charge (base drops to the goods subtotal, see
 * `useCheckoutSession`), so express shipping is charged once. The buyer picks the rate in the sheet.
 */
export interface DemoShippingRate {
  code: string;
  amount: string;
  name: string;
  deliveryEstimate?: string;
}

export interface ExpressConfig {
  env: EnvName;
  clientId: string;
  country: string;
  locale: string;
  walletMode: WalletMode;
  expressWallets: ExpressWalletsConfig;
  expressOperationType: ExpressOperationType;
  allowRealRedirect: boolean;
  // ECE shipping. QA-editable: the opt-in toggle + a comma-separated ISO alpha-2 allowlist string
  // (parsed to an array when assembling the drop-in config). The rate set is a fixed preset below (not
  // QA-editable), so only the two fields above feed the remount identity (`reinitSignatureOf`).
  shippingAddressRequired: boolean;
  allowedShippingCountries: string;
  shippingRates: DemoShippingRate[];
  // Charge-body-only cart products. When on, the demo passes a `products[]` on `dropIn('express')`
  // (one line per cart item + a shipping-fee line when applicable) that sums to the drop-in `amount`,
  // replacing the SDK's synthesized `product item` base line. Participates in the remount identity so
  // toggling it re-pushes (products are set at drop-in time, not via `express.update`).
  sendProducts: boolean;
}

/**
 * Fixed multi-rate preset the demo offers when ECE shipping is enabled. A NON-zero first rate would
 * hide the freeze-rework bugs the SDK guards against, so keep the free "standard" first and a paid rate
 * after it to exercise the total-tracks-selection path on-device.
 */
export const DEMO_EXPRESS_SHIPPING_RATES: DemoShippingRate[] = [
  { code: "standard", amount: "0", name: "Standard", deliveryEstimate: "5-7 business days" },
  { code: "express", amount: "9.99", name: "Express", deliveryEstimate: "2-3 business days" },
  { code: "overnight", amount: "24.99", name: "Overnight", deliveryEstimate: "1 business day" },
];

/**
 * Splits the comma-separated ISO-alpha-2 allowlist string into a normalized array (trim, upper-case,
 * keep only 2-letter codes). Shared by ConfigSheet (checkbox state) and expressElement (drop-in config)
 * so the two parse paths never drift.
 */
export function parseAllowedShippingCountries(value: string): string[] {
  return value
    .split(",")
    .map((code) => code.trim().toUpperCase())
    .filter((code) => /^[A-Z]{2}$/.test(code));
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
    // ECE shipping is a create-time ECE option (rates are not updatable in place), so a change to the
    // opt-in or the allowlist must remount. Only these two QA-editable fields participate; the rate
    // preset is fixed, so it never fragments the identity.
    String(config.shippingAddressRequired),
    config.allowedShippingCountries,
    // Products are pushed at drop-in time (not via express.update), so a toggle must remount to apply.
    String(config.sendProducts),
  ].join("|");
}

// Public merchant-application token per environment (public, not a secret — the backend validates
// clientId server-side). Baked in so the demo works out of the box; override for every env via
// VITE_EXPRESS_CLIENT_ID, or per session in the config sheet. The checkout.integration token is the
// same one used by the checkout-web-stripe express.html BE integration sample.
const DEMO_EXPRESS_CLIENT_IDS: Record<EnvName, string> = {
  "checkout.integration": "v1.opt-div-app.41634a3ac45e4eb7b194bce4f36123e7",
  sandbox: "v1.opt-div-app.1dbc56f2e0e54037b1f2dcfeba9fc901",
};

export function getDefaultClientId(env: EnvName): string {
  return import.meta.env.VITE_EXPRESS_CLIENT_ID || DEMO_EXPRESS_CLIENT_IDS[env];
}

// A LIST session left idle past this is likely expired server-side. Shared by the live keep-alive
// staleness guard (useCheckoutSession) and the prefetch cache (expressPrefetch) so both age sessions
// out on the same clock. Kept comfortably below the backend session lifetime.
export const SESSION_TTL_MS = 15 * 60 * 1000;

export const DEFAULT_EXPRESS_CONFIG: ExpressConfig = {
  // Cards use this env (has a Divisions entry → LIST resolves). The SDK derives the GET /express host
  // from this same `env`; the demo's fetch shim + vite `/opg-proxy` (OPG_PROXY_TARGET) forward that
  // cross-origin call server-to-server to dodge CORS on https://localhost.
  env: "checkout.integration",
  clientId: getDefaultClientId("checkout.integration"),
  country: "US",
  // A raw host locale string the SDK maps to Stripe's locale + the matching translation bundle. Kept
  // to an SDK-supported tag (see `LOCALES`) so the config sheet's locale <select> always has a match.
  locale: "en",
  walletMode: "both",
  expressWallets: { applePay: "auto", googlePay: "auto" },
  expressOperationType: "charge",
  allowRealRedirect: false,
  // ECE shipping off by default; a comma-separated allowlist QA can edit; a fixed rate preset.
  shippingAddressRequired: false,
  allowedShippingCountries: "US,CA",
  shippingRates: DEMO_EXPRESS_SHIPPING_RATES,
  // Cart products off by default (opt-in in the config sheet).
  sendProducts: false,
};
