import { create } from "zustand";
import type { CheckoutInstance } from "@/features/embeddedCheckout/types/checkout";
import type { WalletsAvailability } from "@/features/expressCheckout/types/express";

export type ExpressStatus = "idle" | "loading" | "ready" | "error";
export type ExpressOutcome = { kind: "success"; data: unknown } | { kind: "declined"; data: unknown };

interface ExpressCheckoutState {
  checkout: CheckoutInstance | null;
  status: ExpressStatus;
  error: string | null;
  lastAvailability: WalletsAvailability | null;
  lastOutcome: ExpressOutcome | null;
  setCheckout: (checkout: CheckoutInstance | null) => void;
  setStatus: (status: ExpressStatus, error?: string | null) => void;
  setAvailability: (a: WalletsAvailability | null) => void;
  setOutcome: (o: ExpressOutcome | null) => void;
}

export const useExpressCheckoutStore = create<ExpressCheckoutState>((set) => ({
  checkout: null,
  status: "idle",
  error: null,
  lastAvailability: null,
  lastOutcome: null,
  setCheckout: (checkout) => set({ checkout }),
  setStatus: (status, error = null) => set({ status, error }),
  setAvailability: (lastAvailability) => set({ lastAvailability }),
  setOutcome: (lastOutcome) => set({ lastOutcome }),
}));
