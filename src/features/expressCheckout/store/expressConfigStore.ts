import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  ENVS,
  WALLET_MODES,
  WALLET_VISIBILITY,
  EXPRESS_OPERATION_TYPES,
  EXPRESS_BEFORE_SUBMIT_OUTCOMES,
  LOCALE_VALUES,
  type EnvName,
  type WalletMode,
  type WalletVisibility,
  type ExpressOperationType,
  type ExpressBeforeSubmitOutcome,
  type LocaleValue,
} from "@/features/expressCheckout/types/express";
import {
  DEFAULT_EXPRESS_CONFIG,
  getDefaultClientId,
  RESOLVER_DELAY_RANGE,
  GATE_DELAY_RANGE,
  type ExpressConfig,
} from "@/features/expressCheckout/constants/express";

interface ExpressConfigState extends ExpressConfig {
  setConfig: (patch: Partial<ExpressConfig>) => void;
}

const coerce = <T extends string>(
  value: unknown,
  allowed: readonly T[],
  fallback: T,
): T =>
  typeof value === "string" && (allowed as readonly string[]).includes(value)
    ? (value as T)
    : fallback;

// Storage is user-editable and the slider bounds changed over time, so clamp a persisted latency back
// into [min, max]; a non-finite value falls back to the default.
const clampMs = (
  value: unknown,
  range: { min: number; max: number },
  fallback: number,
): number =>
  typeof value === "number" && Number.isFinite(value)
    ? Math.min(range.max, Math.max(range.min, value))
    : fallback;

export const useExpressConfigStore = create<ExpressConfigState>()(
  persist(
    (set) => ({
      ...DEFAULT_EXPRESS_CONFIG,
      setConfig: (patch) =>
        set((state) => {
          // clientId is derived from env (each env has its own token), so switching env pulls in that
          // env's default clientId. The guard tolerates an explicit clientId in the same patch, though
          // the config sheet no longer offers one.
          if (
            patch.env !== undefined &&
            patch.env !== state.env &&
            patch.clientId === undefined
          ) {
            return { ...patch, clientId: getDefaultClientId(patch.env) };
          }
          return patch;
        }),
    }),
    {
      name: "express-config-storage",
      storage: createJSONStorage(() => localStorage),
      // Storage is user-editable: coerce every enum back into its allowed set.
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<ExpressConfig>;
        const wallets = (p.expressWallets ?? {}) as Partial<
          ExpressConfig["expressWallets"]
        >;
        // `env` is interpolated into the API host and the SDK <script src>, so never trust the
        // persisted value verbatim - coerce it back into the known set like the other enums.
        const env = coerce<EnvName>(p.env, ENVS, DEFAULT_EXPRESS_CONFIG.env);
        return {
          ...current,
          ...p,
          env,
          // clientId is derived from env (each env has its own token) and is no longer user-editable,
          // so ignore any persisted value and re-derive it from the resolved env.
          clientId: getDefaultClientId(env),
          walletMode: coerce<WalletMode>(
            p.walletMode,
            WALLET_MODES,
            DEFAULT_EXPRESS_CONFIG.walletMode,
          ),
          // The locale <select> only offers SDK-supported tags, so coerce a stale persisted value
          // (e.g. a pre-picker `en_US`) back into the set to avoid a controlled-select value mismatch.
          locale: coerce<LocaleValue>(
            p.locale,
            LOCALE_VALUES,
            DEFAULT_EXPRESS_CONFIG.locale as LocaleValue,
          ),
          allowRealRedirect:
            typeof p.allowRealRedirect === "boolean"
              ? p.allowRealRedirect
              : DEFAULT_EXPRESS_CONFIG.allowRealRedirect,
          // ECE shipping: the opt-in + allowlist are QA-editable, so coerce them like the other
          // user-editable fields. The rate set is a FIXED preset (not QA-editable), so always re-derive
          // it from the default - never trust a persisted array shape.
          shippingAddressRequired:
            typeof p.shippingAddressRequired === "boolean"
              ? p.shippingAddressRequired
              : DEFAULT_EXPRESS_CONFIG.shippingAddressRequired,
          allowedShippingCountries:
            typeof p.allowedShippingCountries === "string"
              ? p.allowedShippingCountries
              : DEFAULT_EXPRESS_CONFIG.allowedShippingCountries,
          shippingRates: DEFAULT_EXPRESS_CONFIG.shippingRates,
          // Resolver-returned products cart + the onBeforeSubmit gate: user-editable, so coerce like the
          // other QA toggles (the outcome is an enum, so bounce a stale value back into the allowed set).
          dynamicResolverProducts:
            typeof p.dynamicResolverProducts === "boolean"
              ? p.dynamicResolverProducts
              : DEFAULT_EXPRESS_CONFIG.dynamicResolverProducts,
          beforeSubmit:
            typeof p.beforeSubmit === "boolean"
              ? p.beforeSubmit
              : DEFAULT_EXPRESS_CONFIG.beforeSubmit,
          beforeSubmitOutcome: coerce<ExpressBeforeSubmitOutcome>(
            p.beforeSubmitOutcome,
            EXPRESS_BEFORE_SUBMIT_OUTCOMES,
            DEFAULT_EXPRESS_CONFIG.beforeSubmitOutcome,
          ),
          // Both artificial-latency knobs: clamp a persisted value into the current slider bounds (an
          // older build stored 0, which is now below the min).
          dynamicRatesDelayMs: clampMs(
            p.dynamicRatesDelayMs,
            RESOLVER_DELAY_RANGE,
            DEFAULT_EXPRESS_CONFIG.dynamicRatesDelayMs,
          ),
          beforeSubmitDelayMs: clampMs(
            p.beforeSubmitDelayMs,
            GATE_DELAY_RANGE,
            DEFAULT_EXPRESS_CONFIG.beforeSubmitDelayMs,
          ),
          expressOperationType: coerce<ExpressOperationType>(
            p.expressOperationType,
            EXPRESS_OPERATION_TYPES,
            DEFAULT_EXPRESS_CONFIG.expressOperationType,
          ),
          expressWallets: {
            applePay: coerce<WalletVisibility>(
              wallets.applePay,
              WALLET_VISIBILITY,
              "auto",
            ),
            googlePay: coerce<WalletVisibility>(
              wallets.googlePay,
              WALLET_VISIBILITY,
              "auto",
            ),
          },
        };
      },
    },
  ),
);
