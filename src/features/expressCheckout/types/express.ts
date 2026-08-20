// Enum single-source-of-truth. Mirrors checkout-web zod enums in
// projects/checkout-web/src/schemas/checkout.configuration.ts (walletMode / ExpressWalletVisibility / expressOperationType).
export const WALLET_MODES = ["inline", "express", "both"] as const;
export type WalletMode = (typeof WALLET_MODES)[number];

export const WALLET_VISIBILITY = ["auto", "always", "never"] as const;
export type WalletVisibility = (typeof WALLET_VISIBILITY)[number];

export const EXPRESS_OPERATION_TYPES = ["charge", "preset"] as const;
export type ExpressOperationType = (typeof EXPRESS_OPERATION_TYPES)[number];

// Demo-offered OPG environments (the config sheet's env dropdown). A persisted `env` is coerced back
// into this set on rehydrate before it is interpolated into the API host / SDK <script src>.
export const ENVS = ["checkout.integration", "ramy.integration", "sandbox"] as const;
export type EnvName = (typeof ENVS)[number];

export interface ExpressWalletsConfig {
  applePay: WalletVisibility;
  googlePay: WalletVisibility;
}

// Availability payload, mirrors checkout-web/src/types/events.ts 'wallets:availability'.
export type WalletsAvailability =
  | { available: true; applePay?: boolean; googlePay?: boolean }
  | { available: false };

// The public event bus (`checkout.on("wallets:availability", h)`) delivers the RAW availability
// object as the handler payload — NOT a { event, data } envelope. (Verified in checkout-web
// DropIn.ts: emitPublicEvent(detail.event, detail.data) → publicEvents.emit(name, detail.data).)
// So the guard must validate the availability object directly.
export function isWalletsAvailability(data: unknown): data is WalletsAvailability {
  return (
    typeof data === "object" &&
    data !== null &&
    typeof (data as { available?: unknown }).available === "boolean"
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
