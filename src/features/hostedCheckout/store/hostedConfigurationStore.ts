import { create } from "zustand";
import type {
  BillingAddress,
  MerchantCart,
  ShippingAddress,
} from "../../../types/merchant";

export enum CurrentStep {
  CHOOSE_ENV = "choose-env",
  CONFIGURE_CART = "configure-cart",
  CONFIGURE_ADDRESS = "configure-address",
  REVIEW_CONFIRM = "review-confirm",
}

interface HostedConfigurationStore {
  currentStep: CurrentStep;
  env: string;
  merchantCart: MerchantCart;
  billingAddress: BillingAddress;
  shippingAddress: ShippingAddress;
  sameAddress: boolean;
  setCurrentStep?: (step: CurrentStep) => void;
  setEnv?: (env: string) => void;
  setMerchantCart?: (cart: Partial<MerchantCart>) => void;
  setBillingAddress?: (address: Partial<BillingAddress>) => void;
  setShippingAddress?: (address: Partial<ShippingAddress>) => void;
  setSameAddress?: (value: boolean) => void;
}

export const useHostedConfigurationStore = create<HostedConfigurationStore>()(
  (set) => ({
    currentStep: CurrentStep.CHOOSE_ENV,
    env: "sandbox",
    merchantCart: {
      amount: 15,
      itemName: "Sample Item",
      quantity: 1,
      currency: "USD",
    },
    billingAddress: {
      firstName: "John",
      lastName: "Doe",
      email: "john_doe@email-domain.com",
      phone: "",
      street: "123 Main St",
      houseNumber: "1A",
      zip: "12345",
      city: "Anytown",
      state: "CA",
      country: "US",
      number: "777",
      birthday: "1977-09-13",
    },
    shippingAddress: {
      firstName: "John",
      lastName: "Doe",
      email: "john_doe@email-domain.com",
      phone: "",
      street: "123 Main St",
      houseNumber: "1A",
      zip: "12345",
      city: "Anytown",
      state: "CA",
      country: "US",
      number: "777",
      birthday: "1977-09-13",
    },
    sameAddress: true,
    setCurrentStep: (step: CurrentStep) => set({ currentStep: step }),
    setEnv: (env: string) => set({ env }),
    setMerchantCart: (cart: Partial<MerchantCart>) =>
      set((state) => ({
        merchantCart: { ...state.merchantCart, ...cart },
      })),
    setBillingAddress: (address: Partial<BillingAddress>) =>
      set((state) => ({
        billingAddress: { ...state.billingAddress, ...address },
      })),
    setShippingAddress: (address: Partial<ShippingAddress>) =>
      set((state) => ({
        shippingAddress: { ...state.shippingAddress, ...address },
      })),
    setSameAddress: (value: boolean) => set({ sameAddress: value }),
  })
);
