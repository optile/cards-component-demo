import { create } from "zustand";

type PayButtonType = "default" | "custom";

export interface BillingAddress {
  firstName: string;
  lastName: string;
  email: string;
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

export const useConfigurationStore = create<ConfigurationState>((set) => ({
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
}));
