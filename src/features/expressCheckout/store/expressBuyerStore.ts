import { create } from "zustand";
import type { BillingAddress } from "@/types/merchant";
import { DEMO_BILLING } from "@/features/expressCheckout/constants/express";

/** Checkout-form country options. `OTHER` bills as US on the LIST (and uses the US est. tax rate). */
export const BUYER_COUNTRIES = [
  ["US", "United States"],
  ["GB", "United Kingdom"],
  ["CA", "Canada"],
  ["AU", "Australia"],
  ["DE", "Germany"],
  ["IN", "India"],
  ["PH", "Philippines"],
  ["OTHER", "Somewhere else"],
] as const;

export type BuyerCountry = (typeof BUYER_COUNTRIES)[number][0];

export interface BuyerForm {
  email: string;
  fullName: string;
  country: string;
}

interface ExpressBuyerState extends BuyerForm {
  /** Committed copy synced to the card LIST in place (updated on blur / country change). */
  committed: BuyerForm;
  setEmail: (email: string) => void;
  setFullName: (fullName: string) => void;
  setCountry: (country: string) => void;
  /** Copy live fields into `committed` (call on blur of email/name, and immediately on country). */
  commit: () => void;
}

const DEFAULT_FORM: BuyerForm = {
  email: "",
  fullName: "",
  country: "US",
};

/** ISO country the LIST is billed in for a form country. */
export function listCountryOf(country: string): string {
  return country === "OTHER" ? "US" : country;
}

function splitFullName(fullName: string): { firstName: string; lastName: string } {
  const trimmed = fullName.trim();
  if (!trimmed) return { firstName: "", lastName: "Reader" };
  const i = trimmed.indexOf(" ");
  if (i < 0) return { firstName: trimmed, lastName: "Reader" };
  return {
    firstName: trimmed.slice(0, i),
    lastName: trimmed.slice(i + 1).trim() || "Reader",
  };
}

/** Card LIST billing: form identity + DEMO street stubs. */
export function billingFromBuyer(buyer: BuyerForm): BillingAddress {
  const { firstName, lastName } = splitFullName(buyer.fullName);
  return {
    ...DEMO_BILLING,
    firstName: firstName || DEMO_BILLING.firstName,
    lastName,
    email: buyer.email.trim() || DEMO_BILLING.email,
    country: listCountryOf(buyer.country),
  };
}

/** What the card LIST carries for a buyer; equal signatures need no LIST update. */
export function buyerSignatureOf(buyer: BuyerForm): string {
  const b = billingFromBuyer(buyer);
  return [b.email, b.firstName, b.lastName, b.country].join("|");
}

export const useExpressBuyerStore = create<ExpressBuyerState>((set, get) => ({
  ...DEFAULT_FORM,
  committed: { ...DEFAULT_FORM },
  setEmail: (email) => set({ email }),
  setFullName: (fullName) => set({ fullName }),
  setCountry: (country) => {
    set({ country });
    get().commit();
  },
  commit: () => {
    const { email, fullName, country, committed } = get();
    const next = { email, fullName, country };
    if (buyerSignatureOf(next) === buyerSignatureOf(committed)) return;
    set({ committed: next });
  },
}));
