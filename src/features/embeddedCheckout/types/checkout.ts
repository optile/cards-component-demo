import type {
  Checkout,
  CheckoutConfigurationProps,
  DropIn,
  ExpressDropIn,
  ExpressDropInConfig,
  OnComponentListChangeCallback,
  OnReadyCallback,
  TAvailableDropInComponent,
  TReadyEventData,
} from "@payoneer/checkout-web";

/**
 * Demo type surface for the Payoneer Checkout Web SDK.
 *
 * The SDK is loaded at runtime from the CDN (a <script> tag → `window.Payoneer`); it is never
 * bundled. `@payoneer/checkout-web` is therefore a TYPES-ONLY devDependency: every import here is
 * `import type` (zero runtime, zero bundle impact). The SDK-facing shapes below are ALIASES of the
 * published public types so the demo compiles against the real contract and cannot silently drift -
 * do NOT re-declare them by hand. Shapes that are NOT part of the SDK's public API (the demo's own
 * backend / CDN shapes) are defined locally further down.
 */

// --- SDK-derived aliases (single source of truth = @payoneer/checkout-web) ---

/** The CheckoutWeb instance handle returned by `window.Payoneer.CheckoutWeb(...)`. */
export type CheckoutInstance = Checkout;

/** A classic (card) drop-in handle. `dropIn(name, ...)` returns this or `undefined`. */
export type DropInComponent = DropIn;

/** The express drop-in handle (`dropIn('express', ...)`). */
export type ExpressDropInComponent = ExpressDropIn;

/** Per-transaction express mount config (`paymentReference` / `transactionId` are required). */
export type ExpressDropInProps = ExpressDropInConfig;

/** One available payment method from `availableDropInComponents()`. */
export type PaymentMethod = TAvailableDropInComponent;

/** One network entry within a PaymentMethod. */
export type NetworkInformation =
  TAvailableDropInComponent["networkInformation"][number];

/** The `onReady` payload (Stripe PaymentElement ready snapshot). */
export type ReadyEventData = TReadyEventData;

/** The diff passed to `onComponentListChange` (carries an optional `chargeResponse`). */
export type ComponentListDiff = Parameters<OnComponentListChangeCallback>[1];

/** The `onReady` callback: `(checkout, componentName, data)`. Derived from the SDK (was a 2-arg mirror). */
export type OnReadyHandler = OnReadyCallback;

/**
 * Init config for `window.Payoneer.CheckoutWeb(...)`, derived verbatim from the SDK.
 *
 * `onReady` is the SDK's `(checkout, componentName, data)` callback. `CheckoutWeb` wraps every
 * top-level config callback in its `DROP_IN_CONFIG_KEYS` list (which includes `onReady`): the 2-arg
 * `(name, data)` function bound to the element internally calls `merchantOnReady(checkout, name,
 * data)`, so the merchant handler on THIS config receives `checkout` first. (Do not be fooled by the
 * element layer's 2-arg `TOnReadyCB` - that is the wrapper, not the merchant callback. An earlier
 * demo note claimed a plain 2-arg `(componentName, data)` shape here - that was wrong.) The demo's
 * own handlers ignore the arguments, so nothing here depends on the arity.
 */
export type CheckoutInstanceConfig = CheckoutConfigurationProps;

/**
 * The top-level `onBeforeSubmit` pre-charge gate callback. Runs before the charge for every drop-in on
 * the instance (express + card); on express it may return the widened object result (proceed + charge
 * overrides), on card a bare boolean. Derived from the SDK config so the demo tracks the real contract.
 */
export type OnBeforeSubmitHandler = NonNullable<
  CheckoutInstanceConfig["onBeforeSubmit"]
>;

// --- Demo-owned shapes (NOT part of the SDK's public API) ---

/**
 * Request body the DEMO's backend accepts to CREATE a LIST session. This is the demo server's own
 * contract, not a checkout-web type - the browser SDK never creates sessions, it consumes a `longId`
 * (the SDK's `ListResult` / `ListDataProps` is the fetched LIST payload, a different shape).
 */
export interface ListSessionRequest {
  transactionId?: string;
  checkoutConfigurationName?: string;
  currency: string;
  amount: number;
  country: string;
  division: string;
  customer: {
    firstName: string;
    lastName: string;
    birthday: string;
    email: string;
  };
  products: Array<{
    name: string;
    amount: number;
  }>;
}

/** Response from the demo backend's create-session endpoint. */
export interface ListSessionResponse {
  id: string;
  transactionId: string;
  url: string;
  [key: string]: unknown;
}

/**
 * Demo flow selector (embedded vs hosted). A runtime enum, distinct from the SDK's `IntegrationType`
 * (`DISPLAY_NATIVE` / `PURE_NATIVE` / …, exported only as a type). Kept local because it is a demo
 * concept AND a types-only SDK import could not supply a runtime enum value regardless.
 */
export enum INTEGRATION_TYPE {
  EMBEDDED = "EMBEDDED",
  HOSTED = "HOSTED",
}

/**
 * CDN rehost-manifest shape, read to display the loaded SDK version. This is a deployment artifact,
 * not the SDK's runtime `MetaInfoProps`.
 */
export interface CheckoutWebMetaInfo {
  "checkout-web": CheckoutWebVariant[];
}

interface CheckoutWebVariant {
  src: string;
  version: string;
  integrity: string;
  isMinified: boolean;
  isVersioned: boolean;
}

// The SDK object is attached to `window` by the CDN script at runtime. Its TYPE is derived from the
// package (the `CheckoutWeb` function signature and its `Promise<Checkout>` return) via a type-only
// dynamic import, so the global declaration stays in lockstep with the SDK.
declare global {
  interface Window {
    Payoneer: {
      CheckoutWeb: typeof import("@payoneer/checkout-web").CheckoutWeb;
    };
  }
}
