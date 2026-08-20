import { create } from "zustand";

export type ExpressOutcome =
  | { kind: "success"; data: unknown }
  | { kind: "declined"; data: unknown };

// Bridges the (async, imperative) SDK submit callbacks to React navigation. useCheckout publishes an
// outcome here; CheckoutView subscribes ONLY while active and navigates to the result page, then
// clears it. Kept in a store (not local state) so a kept-alive/hidden checkout instance can't hijack
// navigation and so a stale outcome can be cleared before re-subscribing.
interface ExpressCheckoutState {
  lastOutcome: ExpressOutcome | null;
  setOutcome: (o: ExpressOutcome | null) => void;
}

export const useExpressCheckoutStore = create<ExpressCheckoutState>((set) => ({
  lastOutcome: null,
  setOutcome: (lastOutcome) => set({ lastOutcome }),
}));
