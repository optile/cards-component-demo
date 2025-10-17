import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import hashStorage from "../utils/urlHashStorage";

type PayButtonType = "default" | "custom";

export interface ShippingAddress {
  firstName: string;
  lastName: string;
  phone: string;
  street: string;
  houseNumber: string;
  zip: string;
  city: string;
  state: string;
  country: string;
  number: string;
  birthday: string;
}

export interface BillingAddress extends ShippingAddress {
  email: string;
}

export interface MerchantCart {
  amount: number;
  itemName: string;
  quantity: number;
  currency: string;
}

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
  setBillingAddress: (address: Partial<BillingAddress>) => void;
  setShippingAddress: (address: Partial<ShippingAddress>) => void;
  setSameAddress: (value: boolean) => void;
}

export const useConfigurationStore = create<ConfigurationState>()(
  persist(
    (set) => ({
      payButtonType: "default",
      primaryColor: "#000000",
      primaryTextColor: "#ffffff",
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
      setPayButtonType: (type) => set({ payButtonType: type }),
      setPrimaryColor: (color) => set({ primaryColor: color }),
      setPrimaryTextColor: (color) => set({ primaryTextColor: color }),
      setMerchantCart: (cart) =>
        set((state) => ({ merchantCart: { ...state.merchantCart, ...cart } })),
      setBillingAddress: (address) =>
        set((state) => ({
          billingAddress: { ...state.billingAddress, ...address },
        })),
      setShippingAddress: (address) =>
        set((state) => ({
          shippingAddress: { ...state.shippingAddress, ...address },
        })),
      setSameAddress: (value) => set({ sameAddress: value }),
    }),
    {
      name: "configuration-storage",
      storage: createJSONStorage(() => hashStorage),
      partialize: (state) => ({
        merchantCart: {
          amount: state.merchantCart.amount,
          itemName: state.merchantCart.itemName,
          quantity: state.merchantCart.quantity,
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
