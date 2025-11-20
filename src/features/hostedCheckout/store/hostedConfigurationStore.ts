import { create } from "zustand";
import type {
  BillingAddress,
  MerchantCart,
  ShippingAddress,
  CartProduct,
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
  addProduct?: (product: CartProduct) => void;
  updateProduct?: (index: number, product: Partial<CartProduct>) => void;
  removeProduct?: (index: number) => void;
  setBillingAddress?: (address: Partial<BillingAddress>) => void;
  setShippingAddress?: (address: Partial<ShippingAddress>) => void;
  setSameAddress?: (value: boolean) => void;
  getTotalAmount?: () => number;
}

export const useHostedConfigurationStore = create<HostedConfigurationStore>()(
  (set, get) => ({
    currentStep: CurrentStep.CHOOSE_ENV,
    env: "sandbox",
    merchantCart: {
      products: [
        {
          name: "Sample Item",
          price: 15,
          quantity: 1,
        },
      ],
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
    addProduct: (product: CartProduct) =>
      set((state) => ({
        merchantCart: {
          ...state.merchantCart,
          products: [...state.merchantCart.products, product],
        },
      })),
    updateProduct: (index: number, product: Partial<CartProduct>) =>
      set((state) => ({
        merchantCart: {
          ...state.merchantCart,
          products: state.merchantCart.products.map((p, i) =>
            i === index ? { ...p, ...product } : p
          ),
        },
      })),
    removeProduct: (index: number) =>
      set((state) => ({
        merchantCart: {
          ...state.merchantCart,
          products: state.merchantCart.products.filter((_, i) => i !== index),
        },
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
    getTotalAmount: () => {
      const state = get();
      return state.merchantCart.products.reduce(
        (total, product) => total + product.price * product.quantity,
        0
      );
    },
  })
);
