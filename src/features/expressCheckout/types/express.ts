// Enum single-source-of-truth. Mirrors the Payoneer Web SDK's checkout configuration enums
// (walletMode / ExpressWalletVisibility / expressOperationType).
export const WALLET_MODES = ["inline", "express", "both"] as const;
export type WalletMode = (typeof WALLET_MODES)[number];

export const WALLET_VISIBILITY = ["auto", "always", "never"] as const;
export type WalletVisibility = (typeof WALLET_VISIBILITY)[number];

export const EXPRESS_OPERATION_TYPES = ["charge", "preset"] as const;
export type ExpressOperationType = (typeof EXPRESS_OPERATION_TYPES)[number];

// Demo-offered OPG environments (the config sheet's env dropdown). A persisted `env` is coerced back
// into this set on rehydrate before it is interpolated into the API host / SDK <script src>.
export const ENVS = ["checkout.integration", "sandbox"] as const;
export type EnvName = (typeof ENVS)[number];

// SDK-supported UI locales — mirrors the translation bundles shipped by the Web SDK
// (checkout-web-stripe/src/translations, checkout-web/src/translations). `value` is the raw host
// locale string handed to the SDK (which maps it to Stripe's locale union and selects the matching
// translation bundle); `label` is the human-readable name shown in the demo's locale picker. Order
// mirrors the SDK's `translations/index.ts` so the set stays auditable against the source of truth.
export const LOCALES = [
  { value: "en", label: "English" },
  { value: "bg", label: "Bulgarian" },
  { value: "cs", label: "Czech" },
  { value: "de", label: "German" },
  { value: "el", label: "Greek" },
  { value: "en_GB", label: "English (UK)" },
  { value: "es_AR", label: "Spanish (Latin America)" },
  { value: "es", label: "Spanish" },
  { value: "fr", label: "French" },
  { value: "hr", label: "Croatian" },
  { value: "hu", label: "Hungarian" },
  { value: "id_ID", label: "Indonesian" },
  { value: "it", label: "Italian" },
  { value: "ja", label: "Japanese" },
  { value: "ko", label: "Korean" },
  { value: "nl", label: "Dutch" },
  { value: "no", label: "Norwegian" },
  { value: "pl", label: "Polish" },
  { value: "pt_BR", label: "Portuguese (Brazil)" },
  { value: "pt", label: "Portuguese" },
  { value: "ro", label: "Romanian" },
  { value: "ru", label: "Russian" },
  { value: "sk", label: "Slovak" },
  { value: "sl", label: "Slovenian" },
  { value: "sr_RS", label: "Serbian (Serbia)" },
  { value: "sr", label: "Serbian" },
  { value: "sv", label: "Swedish" },
  { value: "th", label: "Thai" },
  { value: "tr", label: "Turkish" },
  { value: "ur", label: "Urdu" },
  { value: "vi", label: "Vietnamese" },
  { value: "zh_TW", label: "Chinese (Traditional)" },
  { value: "zh", label: "Chinese (Simplified)" },
] as const;
export type LocaleValue = (typeof LOCALES)[number]["value"];
export const LOCALE_VALUES = LOCALES.map((l) => l.value) as readonly LocaleValue[];

export interface ExpressWalletsConfig {
  applePay: WalletVisibility;
  googlePay: WalletVisibility;
}

// Single coherent express lifecycle signal, mirrors the SDK's public `express:state` event.
// One subscription + one switch drives the slot: reveal on `ready`, keep hidden otherwise.
export type ExpressState =
  | { phase: "loading"; component: string }
  | {
      phase: "ready";
      component: string;
      wallets: { applePay: boolean; googlePay: boolean };
    }
  | { phase: "unavailable"; component: string }
  | {
      phase: "error";
      component: string;
      errorType: "express_unavailable" | "express_no_wallets";
      errorMessage?: string;
    };

const EXPRESS_PHASES = ["loading", "ready", "unavailable", "error"] as const;

// The public event bus (`checkout.on("express:state", h)`) delivers the RAW state object as the
// handler payload — NOT a { event, data } envelope — so the guard validates the state object
// directly.
export function isExpressState(data: unknown): data is ExpressState {
  return (
    typeof data === "object" &&
    data !== null &&
    (EXPRESS_PHASES as readonly string[]).includes(
      (data as { phase?: unknown }).phase as string,
    )
  );
}

export type OnSubmitSuccess = (payload: unknown) => boolean | void;
export type OnSubmitError = (payload: unknown) => void;

// Mirrors the PageTurner design catalog record. `c1`/`c2` are the cover gradient stops used as the
// fallback when the real cover image (a local bundled JPG in `public/covers/{isbn}.jpg`, originally
// sourced from Open Library) is missing.
export interface Book {
  id: number;
  title: string;
  author: string;
  genre: string;
  price: number;
  rating: number;
  reviews: number;
  c1: string;
  c2: string;
  description: string;
  isbn: string;
}
