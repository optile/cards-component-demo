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

export interface CheckoutInstance {
  availableDropInComponents(): PaymentMethod[];
  dropInComponents: Record<string, DropInComponent>;
  // Express overload first: returns undefined under walletMode 'inline' / unknown method.
  dropIn(methodName: "express", options?: ExpressDropInProps): DropInComponent | undefined;
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
 * A planned SDK interface change moves express money to a minor-unit integer (cents) to avoid float
 * rounding at this boundary — tracked as story S14 in docs/2026-07-30-express-checkout-jira-tickets.md.
 */
export interface ExpressDropInProps {
  amount?: string;
  currency?: string;
  country?: string;
  clientId?: string;
  locale?: string;
  paymentReference?: string;
}

export interface CheckoutInstanceConfig {
  longId: string;
  env: string;
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
