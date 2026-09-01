import { create } from "zustand";
import type { ExpressOrderDetails } from "@/features/expressCheckout/types/express";

export type ExpressOutcome =
  | { kind: "success"; data: unknown }
  | { kind: "declined"; data: unknown };

interface ExpressCheckoutState {
  lastOutcome: ExpressOutcome | null;
  setOutcome: (o: ExpressOutcome | null) => void;
  // Live express:order snapshot (provisional while the wallet sheet is open). Display-only — NEVER
  // call express.update from code that reads this. Cleared on teardown / new checkout.
  liveExpressOrder: ExpressOrderDetails | null;
  setLiveExpressOrder: (o: ExpressOrderDetails | null) => void;
  // Final express order captured from onSubmitSuccess BEFORE setOutcome clears. Memory-only (no
  // localStorage). Cleared when leaving the Success page or starting a new checkout.
  finalExpressOrder: ExpressOrderDetails | null;
  setFinalExpressOrder: (o: ExpressOrderDetails | null) => void;
}

export const useExpressCheckoutStore = create<ExpressCheckoutState>((set) => ({
  lastOutcome: null,
  setOutcome: (lastOutcome) => set({ lastOutcome }),
  liveExpressOrder: null,
  setLiveExpressOrder: (liveExpressOrder) => set({ liveExpressOrder }),
  finalExpressOrder: null,
  setFinalExpressOrder: (finalExpressOrder) => set({ finalExpressOrder }),
}));
