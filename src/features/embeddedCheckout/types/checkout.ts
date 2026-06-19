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
  dropIn(
    methodName: string,
    options?: { hideSubmitButton: boolean }
  ): DropInComponent;
  charge(): void;
  update(config: { env?: string; longId?: string }): Promise<CheckoutInstance>;
  updateLongId(longId: string): Promise<void>;
  on(event: string, handler: (data: unknown) => void): void;
  off(event: string, handler: (data: unknown) => void): void;
  once(event: string, handler: (data: unknown) => void): void;
  destroy(): void;
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
}

export interface ListSessionRequest {
  transactionId?: string;
  currency: string;
  amount: number;
  country: string;
  division: string;
  customer: {
    number: string;
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
