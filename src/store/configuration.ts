import { create } from "zustand";

type PayButtonType = "default" | "custom";

interface ConfigurationState {
  payButtonType: PayButtonType;
  primaryColor: string;
  primaryTextColor: string;
  setPayButtonType: (type: PayButtonType) => void;
  setPrimaryColor: (color: string) => void;
  setPrimaryTextColor: (color: string) => void;
}

export const useConfigurationStore = create<ConfigurationState>((set) => ({
  payButtonType: "default",
  primaryColor: "#000000",
  primaryTextColor: "#ffffff",
  setPayButtonType: (type) => set({ payButtonType: type }),
  setPrimaryColor: (color) => set({ primaryColor: color }),
  setPrimaryTextColor: (color) => set({ primaryTextColor: color }),
}));
