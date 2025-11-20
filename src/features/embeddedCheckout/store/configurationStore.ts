import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import hashStorage from "@/utils/urlHashStorage";
import type {
  BillingAddress,
  MerchantCart,
  ShippingAddress,
  CartProduct,
} from "../../../types/merchant";

type PayButtonType = "default" | "custom";

interface ConfigurationState {
  payButtonType: PayButtonType;
  primaryColor: string;
  primaryTextColor: string;
  merchantCart: MerchantCart;
  billingAddress: BillingAddress;
  shippingAddress: ShippingAddress;
  sameAddress: boolean;
  setPayButtonType: (type: PayButtonType) => void;
  setPrimaryColor: (color: string) => void;
  setPrimaryTextColor: (color: string) => void;
  setMerchantCart: (cart: Partial<MerchantCart>) => void;
  addProduct: (product: CartProduct) => void;
  updateProduct: (index: number, product: Partial<CartProduct>) => void;
  removeProduct: (index: number) => void;
  setBillingAddress: (address: Partial<BillingAddress>) => void;
  setShippingAddress: (address: Partial<ShippingAddress>) => void;
  setSameAddress: (value: boolean) => void;
  getTotalAmount: () => number;
}

export const useConfigurationStore = create<ConfigurationState>()(
  persist(
    (set, get) => ({
      payButtonType: "default",
      primaryColor: "#000000",
      primaryTextColor: "#ffffff",
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
      setPayButtonType: (type) => set({ payButtonType: type }),
      setPrimaryColor: (color) => set({ primaryColor: color }),
      setPrimaryTextColor: (color) => set({ primaryTextColor: color }),
      setMerchantCart: (cart) =>
        set((state) => ({ merchantCart: { ...state.merchantCart, ...cart } })),
      addProduct: (product) =>
        set((state) => ({
          merchantCart: {
            ...state.merchantCart,
            products: [...state.merchantCart.products, product],
          },
        })),
      updateProduct: (index, product) =>
        set((state) => ({
          merchantCart: {
            ...state.merchantCart,
            products: state.merchantCart.products.map((p, i) =>
              i === index ? { ...p, ...product } : p
            ),
          },
        })),
      removeProduct: (index) =>
        set((state) => ({
          merchantCart: {
            ...state.merchantCart,
            products: state.merchantCart.products.filter((_, i) => i !== index),
          },
        })),
      setBillingAddress: (address) =>
        set((state) => ({
          billingAddress: { ...state.billingAddress, ...address },
        })),
      setShippingAddress: (address) =>
        set((state) => ({
          shippingAddress: { ...state.shippingAddress, ...address },
        })),
      setSameAddress: (value) => set({ sameAddress: value }),
      getTotalAmount: () => {
        const state = get();
        return state.merchantCart.products.reduce(
          (total, product) => total + product.price * product.quantity,
          0
        );
      },
    }),
    {
      name: "configuration-storage",
      storage: createJSONStorage(() => hashStorage),
      partialize: (state) => ({
        merchantCart: {
          products: state.merchantCart.products,
          currency: state.merchantCart.currency,
        },
        billingAddress: {
          firstName: state.billingAddress.firstName,
          lastName: state.billingAddress.lastName,
          email: state.billingAddress.email,
          phone: state.billingAddress.phone,
          street: state.billingAddress.street,
          houseNumber: state.billingAddress.houseNumber,
          zip: state.billingAddress.zip,
          city: state.billingAddress.city,
          state: state.billingAddress.state,
          country: state.billingAddress.country,
          number: state.billingAddress.number,
          birthday: state.billingAddress.birthday,
        },
        shippingAddress: {
          firstName: state.shippingAddress.firstName,
          lastName: state.shippingAddress.lastName,
          phone: state.shippingAddress.phone,
          street: state.shippingAddress.street,
          houseNumber: state.shippingAddress.houseNumber,
          zip: state.shippingAddress.zip,
          city: state.shippingAddress.city,
          state: state.shippingAddress.state,
          country: state.shippingAddress.country,
          number: state.shippingAddress.number,
          birthday: state.shippingAddress.birthday,
        },
        sameAddress: state.sameAddress,
      }),
    }
  )
);
