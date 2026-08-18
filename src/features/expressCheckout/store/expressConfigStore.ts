import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  WALLET_MODES,
  WALLET_VISIBILITY,
  EXPRESS_OPERATION_TYPES,
  type WalletMode,
  type WalletVisibility,
  type ExpressOperationType,
} from "@/features/expressCheckout/types/express";
import { DEFAULT_EXPRESS_CONFIG, type ExpressConfig } from "@/features/expressCheckout/constants/express";

interface ExpressConfigState extends ExpressConfig {
  setConfig: (patch: Partial<ExpressConfig>) => void;
  // Identifies the init config; a change means re-initialise CheckoutWeb.
  getReinitSignature: () => string;
}

const coerce = <T extends string>(value: unknown, allowed: readonly T[], fallback: T): T =>
  typeof value === "string" && (allowed as readonly string[]).includes(value) ? (value as T) : fallback;

export const useExpressConfigStore = create<ExpressConfigState>()(
  persist(
    (set, get) => ({
      ...DEFAULT_EXPRESS_CONFIG,
      setConfig: (patch) => set(patch),
      getReinitSignature: () => {
        const s = get();
        return [s.env, s.walletMode, s.expressWallets.applePay, s.expressWallets.googlePay, s.expressOperationType].join("|");
      },
    }),
    {
      name: "express-config-storage",
      storage: createJSONStorage(() => localStorage),
      // Storage is user-editable: coerce every enum back into its allowed set.
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<ExpressConfig>;
        const wallets = (p.expressWallets ?? {}) as Partial<ExpressConfig["expressWallets"]>;
        return {
          ...current,
          ...p,
          walletMode: coerce<WalletMode>(p.walletMode, WALLET_MODES, DEFAULT_EXPRESS_CONFIG.walletMode),
          allowRealRedirect:
            typeof p.allowRealRedirect === "boolean"
              ? p.allowRealRedirect
              : DEFAULT_EXPRESS_CONFIG.allowRealRedirect,
          expressOperationType: coerce<ExpressOperationType>(
            p.expressOperationType, EXPRESS_OPERATION_TYPES, DEFAULT_EXPRESS_CONFIG.expressOperationType),
          expressWallets: {
            applePay: coerce<WalletVisibility>(wallets.applePay, WALLET_VISIBILITY, "auto"),
            googlePay: coerce<WalletVisibility>(wallets.googlePay, WALLET_VISIBILITY, "auto"),
          },
        };
      },
    }
  )
);
