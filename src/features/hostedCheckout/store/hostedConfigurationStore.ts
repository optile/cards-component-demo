import { create } from "zustand";
import type {
  BillingAddress,
  MerchantCart,
  ShippingAddress,
  CartProduct,
} from "../../../types/merchant";
import type { RegistrationType } from "@/constants/registrations";
import { getCartTotal } from "@/utils/cartUtils";

export enum CurrentStep {
  CHOOSE_ENV = "choose-env",
  CONFIGURE_CART = "configure-cart",
  CONFIGURE_ADDRESS = "configure-address",
  REVIEW_CONFIRM = "review-confirm",
  REGISTRATION_SETUP = 'registration-setup'
}

interface HostedConfigurationStore {
  currentStep: CurrentStep;
  env: string;
  paymentMethodOrder: string;
  merchantCart: MerchantCart;
  billingAddress: BillingAddress;
  shippingAddress: ShippingAddress;
  sameAddress: boolean;
  registrationType?: RegistrationType;
  setRegistrationType?: (registrationType: RegistrationType) => void;
  setCurrentStep?: (step: CurrentStep) => void;
  setEnv?: (env: string) => void;
  setPaymentMethodOrder?: (order: string) => void;
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
    registrationType: 'GUEST',
    env: "sandbox",
    paymentMethodOrder: "",
    merchantCart: {
      // Covers every cart summary case on the HPP: quantity > 1, tax, discount and a shipping line
      products: [
        { name: "Silk pillowcase", price: 50, quantity: 2, taxAmount: 19, discountAmount: -10 },
        { name: "Silk eye mask", price: 25, quantity: 3, taxAmount: 14.25 },
        { name: "Gift wrapping", price: 5, quantity: 1 },
        { name: "Express shipping", price: 7.95, quantity: 1, type: "SHIPPING" },
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
      birthday: "1977-09-13",
    },
    sameAddress: true,
    setCurrentStep: (step: CurrentStep) => set({ currentStep: step }),
    setEnv: (env: string) => set({ env }),
    setPaymentMethodOrder: (order: string) => set({ paymentMethodOrder: order }),
    setRegistrationType: (registrationType: RegistrationType) => set({ registrationType }),
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
      return getCartTotal(state.merchantCart.products);
    },
  })
);
