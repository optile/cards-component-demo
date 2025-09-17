import { create } from "zustand";

type PayButtonType = "default" | "custom";

interface ConfigurationState {
  payButtonType: PayButtonType;
  primaryColor: string;
  primaryTextColor: string;
  amount: number;
  setPayButtonType: (type: PayButtonType) => void;
  setPrimaryColor: (color: string) => void;
  setPrimaryTextColor: (color: string) => void;
  setAmount: (amount: number) => void;
}

export const useConfigurationStore = create<ConfigurationState>((set) => ({
  payButtonType: "default",
  primaryColor: "#000000",
  primaryTextColor: "#ffffff",
  amount: 15,
  setPayButtonType: (type) => set({ payButtonType: type }),
  setPrimaryColor: (color) => set({ primaryColor: color }),
  setPrimaryTextColor: (color) => set({ primaryTextColor: color }),
  setAmount: (amount) => set({ amount }),
}));
