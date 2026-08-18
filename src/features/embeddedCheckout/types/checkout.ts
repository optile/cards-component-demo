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

/** Host-supplied express mount passthrough. All strings (they cross the element attribute seam). */
export interface ExpressDropInProps {
  amount?: string;
  currency?: string;
  country?: string;
  clientId?: string;
  expressUrl?: string;
  locale?: string;
  paymentReference?: string;
}

export interface CheckoutInstanceConfig {
  longId: string;
  env: string;
  refetchListBeforeCharge?: boolean;
  preload: string[];
  onBeforeCharge: unknown;
  onBeforeSubmit: unknown;
  onBeforeError: unknown;
  onPaymentSuccess: unknown;
  onSubmitSuccess: unknown;
  onPaymentFailure: unknown;
  onBeforeProviderRedirect: unknown;
  onPaymentDeclined: unknown;
  onSubmitError: unknown;
  // Express (all optional so embedded init, which never sets them, still compiles):
  walletMode?: "inline" | "express" | "both";
  expressWallets?: { applePay: "auto" | "always" | "never"; googlePay: "auto" | "always" | "never" };
  expressOperationType?: "charge" | "preset";
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
