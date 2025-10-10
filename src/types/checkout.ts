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
  pay(): Promise<void>;
  updateNode(options: { hidePaymentButton: boolean }): void;
  element: {
    hidePaymentButton: (hide: boolean) => void;
  };
}

export interface CheckoutInstance {
  availableDropInComponents(): PaymentMethod[];
  dropInComponents: Record<string, DropInComponent>;
  dropIn(
    methodName: string,
    options?: { hidePaymentButton: boolean }
  ): DropInComponent;
  charge(): void;
  update(config: { env?: string; longId?: string }): Promise<CheckoutInstance>; // Add update method
}

export interface CheckoutInstanceConfig {
  longId: string;
  env: string;
  refetchListBeforeCharge?: boolean;
  preload: string[];
  onBeforeCharge: unknown;
  onBeforeError: unknown;
  onPaymentSuccess: unknown;
  onPaymentFailure: unknown;
  onBeforeProviderRedirect: unknown;
  onPaymentDeclined: unknown;
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
}

export interface ListSessionResponse {
  id: string;
  transactionId: string;
  [key: string]: unknown;
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

export declare const Payoneer: typeof window.Payoneer;
