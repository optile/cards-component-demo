import type { BillingAddress, ShippingAddress } from "@/types/merchant";
import {
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
  env: string;
  clientId: string;
  country: string;
  locale: string;
  walletMode: WalletMode;
  expressWallets: ExpressWalletsConfig;
  expressOperationType: ExpressOperationType;
  allowRealRedirect: boolean;
}

export function getDefaultClientId(): string {
  return import.meta.env.VITE_EXPRESS_CLIENT_ID ?? "";
}

export const DEFAULT_EXPRESS_CONFIG: ExpressConfig = {
  env: "checkout.integration",
  clientId: getDefaultClientId(),
  country: "US",
  locale: "en_US",
  walletMode: "both",
  expressWallets: { applePay: "auto", googlePay: "auto" },
  expressOperationType: "charge",
  allowRealRedirect: false,
};
