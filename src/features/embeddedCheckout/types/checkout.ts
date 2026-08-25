export interface NetworkInformation {
  network: string;
  logoUrl: string;
}

export interface PaymentMethod {
  name: string;
  label: string;
  networkInformation: NetworkInformation[];
}

export interface DropInComponent {
  mount(element: HTMLElement | null): DropInComponent;
  unmount(): void;
  submit(): Promise<void>;
  updateNode(options: { hideSubmitButton: boolean }): void;
  element: {
    hideSubmitButton: (hide: boolean) => void;
  };
}

/**
 * Express drop-in handle (`dropIn('express', ...)`). Mirrors the SDK's `ExpressDropIn`: `update` takes
 * the express reconfigure payload and pushes an amount/currency change to the live wallet sheet in
 * place (no remount, no GET /express refetch). Each method returns the handle so calls chain.
 */
export interface ExpressDropInComponent {
  mount(element: HTMLElement | null): ExpressDropInComponent;
  unmount(): ExpressDropInComponent;
  update(config: { amount?: string; currency?: string }): ExpressDropInComponent;
  readonly paymentReference?: string;
}

export interface CheckoutInstance {
  availableDropInComponents(): PaymentMethod[];
  dropInComponents: Record<string, DropInComponent>;
  // Express overload first: returns undefined under walletMode 'inline' / unknown method.
  dropIn(methodName: "express", options?: ExpressDropInProps): ExpressDropInComponent | undefined;
  dropIn(methodName: string, options?: { hideSubmitButton?: boolean }): DropInComponent;
  remove(name: string): boolean;
  charge(): void;
  update(config: { env?: string; longId?: string }): Promise<CheckoutInstance>;
  updateLongId(longId: string): Promise<void>;
  on(event: string, handler: (data: unknown) => void): void;
  off(event: string, handler: (data: unknown) => void): void;
  once(event: string, handler: (data: unknown) => void): void;
  destroy(): void;
}

/**
 * Host-supplied express mount passthrough. All strings (they cross the element attribute seam).
 * NOTE: `amount` is a major-unit decimal string here (e.g. "16.99"), derived via `Number#toFixed(2)`.
 * A production integration would ideally pass express money as a minor-unit integer (cents) to avoid
 * float rounding at this boundary.
 */
export interface ExpressDropInProps {
  // Per-transaction only. Express identity (clientId / country) is declared once at init on
  // CheckoutInstanceConfig, not on the drop-in call.
  amount?: string;
  currency?: string;
  locale?: string;
  paymentReference?: string;
}

export interface CheckoutInstanceConfig {
  longId: string;
  env: string;
  // Express identity, declared once at init (mirrors the SDK's CheckoutConfigurationSchema). Optional
  // so the embedded card flow, which never sets them, still builds a valid config.
  clientId?: string;
  country?: string;
  refetchListBeforeCharge?: boolean;
  preload: string[];
  // Optional lifecycle callbacks: the embedded flow wires the ones it needs; the express init sets
  // only onSubmitSuccess/onSubmitError. All optional so either caller builds a valid config directly.
  onBeforeCharge?: unknown;
  onBeforeSubmit?: unknown;
  onBeforeError?: unknown;
  onPaymentSuccess?: unknown;
  onSubmitSuccess?: unknown;
  onPaymentFailure?: unknown;
  onBeforeProviderRedirect?: unknown;
  onPaymentDeclined?: unknown;
  onSubmitError?: unknown;
  // Express (all optional so embedded init, which never sets them, still compiles):
  walletMode?: "inline" | "express" | "both";
  expressWallets?: { applePay: "auto" | "always" | "never"; googlePay: "auto" | "always" | "never" };
  expressOperationType?: "charge" | "preset";
  // Fired as list data resolves so hosts can mount drop-ins once a component becomes available.
  onComponentListChange?: (
    checkout: CheckoutInstance,
    diff: ComponentListDiff & { chargeResponse?: unknown }
  ) => void;
  // Fires when a payment component has finished rendering (card: Stripe PaymentElement `ready`).
  // NOTE: the drop-in element invokes this at runtime as `(componentName, data)` — checkout-web
  // passes the config callback straight to `element.onReady`, so despite the SDK's public
  // `OnReadyCallback(checkout, componentName, data)` type, only these two args arrive.
  onReady?: (componentName: string, data: ReadyEventData) => void;
}

export interface ReadyEventData {
  component: string;
  availableNetworks: string[];
  selectedNetwork: string | null;
  formReady: boolean;
  walletAvailable: { applePay: boolean; googlePay: boolean };
  timestamp: number;
}

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

export interface ListSessionResponse {
  id: string;
  transactionId: string;
  url: string;
  [key: string]: unknown;
}

export enum INTEGRATION_TYPE {
  EMBEDDED = "EMBEDDED",
  HOSTED = "HOSTED",
}

// Type for the Payoneer global object
declare global {
  interface Window {
    Payoneer: {
      CheckoutWeb: (
        options: CheckoutInstanceConfig
      ) => Promise<CheckoutInstance>;
    };
  }
}

export interface ComponentListDiff {
  addedComponents: Set<string>;
  removedComponents: Set<string>;
  availableComponents: Set<string>;
}

export declare const Payoneer: typeof window.Payoneer;
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
