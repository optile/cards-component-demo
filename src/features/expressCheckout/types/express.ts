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

export interface ExpressWalletsConfig {
  applePay: WalletVisibility;
  googlePay: WalletVisibility;
}

// Single coherent express lifecycle signal, mirrors the SDK's public `express:state` event.
// One subscription + one switch drives the slot: reveal on `ready`, keep hidden otherwise.
export type ExpressState =
  | { phase: "loading"; component: string }
  | { phase: "ready"; component: string; wallets: { applePay: boolean; googlePay: boolean } }
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
    (EXPRESS_PHASES as readonly string[]).includes((data as { phase?: unknown }).phase as string)
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
