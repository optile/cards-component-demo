import type { CheckoutInstance } from "@/features/embeddedCheckout/types/checkout";
import {
  SESSION_TTL_MS,
  reinitSignatureOf,
  type ExpressConfig,
} from "@/features/expressCheckout/constants/express";
import {
  totalOf,
  type CartItem,
} from "@/features/expressCheckout/store/expressCartStore";
import {
  createExpressSession,
  initCheckout,
} from "@/features/expressCheckout/utils/expressSdk";
import type {
  OnSubmitSuccess,
  OnSubmitError,
} from "@/features/expressCheckout/types/express";

// Cap concurrent prefetches so sweeping the mouse across the whole shelf can't spawn an unbounded
// number of LIST sessions + instances. Oldest UNCLAIMED entries are evicted (and destroyed) first.
const MAX_ENTRIES = 4;

interface Handlers {
  onSubmitSuccess: OnSubmitSuccess;
  onSubmitError: OnSubmitError;
}

// Placeholder until a page claims the entry. A wallet can only submit after the ECE is mounted on a
// visible page, so these are never actually invoked — but kept safe rather than throwing.
const NOOP_HANDLERS: Handlers = {
  onSubmitSuccess: () => false,
  onSubmitError: () => {},
};

interface PrefetchEntry {
  key: string;
  createdAt: number;
  // Mutated in place when a page claims the entry so the pre-built instance routes success/decline to
  // that page's navigation without needing a rebuild.
  handlers: Handlers;
  // Resolves with the built (but UNMOUNTED) instance. Rejection is caught by the claimer, which falls
  // back to a fresh build.
  promise: Promise<{ longId: string; instance: CheckoutInstance }>;
}

const entries = new Map<string, PrefetchEntry>();

/**
 * Stable identity of a would-be express session — mirrors the session-affecting inputs the PDP's
 * rebuild key derives from, so a prefetch and the page's own build resolve to the same string.
 *
 * `includeCart` gates the cart-derived inputs (items signature + amount). For an EXPRESS-ONLY surface
 * (`includeCart: false`) these are excluded, because express keys/wallets/networks are amount-
 * independent (amount/currency are not inputs to the express fetch): a quantity tick must NOT fragment
 * the identity or rebuild the instance — it's pushed to the live wallet sheet via `express.update(...)`
 * instead. A CARD surface (`includeCart: true`) keeps them, since the classic LIST total the shopper
 * sees is bound to the built session and has no in-place update seam.
 */
export function expressSessionKey(
  config: ExpressConfig,
  items: CartItem[],
  currency: string,
  includeCart = true,
): string {
  const reinit = reinitSignatureOf(config);
  const itemsSignature = includeCart
    ? items.map((i) => `${i.id}x${i.quantity}`).join(",")
    : undefined;
  const amount =
    includeCart && items.length > 0 ? totalOf(items).toFixed(2) : undefined;
  // `allowRealRedirect` is intentionally excluded: it only affects the submit-time callback (read
  // fresh via callbacksRef), not the built session — so it must not fragment prefetch identity.
  return JSON.stringify([
    reinit,
    config.country,
    config.clientId,
    config.locale,
    itemsSignature,
    amount,
    currency,
  ]);
}

async function destroyEntry(entry: PrefetchEntry): Promise<void> {
  try {
    const { instance } = await entry.promise;
    instance.destroy();
  } catch {
    // Build failed — nothing to destroy.
  }
}

function evictExpired(): void {
  const now = Date.now();
  for (const [key, entry] of entries) {
    if (now - entry.createdAt > SESSION_TTL_MS) {
      entries.delete(key);
      void destroyEntry(entry);
    }
  }
}

function enforceCap(): void {
  // Map iterates in insertion order; the oldest entry is first.
  while (entries.size > MAX_ENTRIES) {
    const oldest = entries.keys().next().value;
    if (oldest === undefined) break;
    const entry = entries.get(oldest);
    entries.delete(oldest);
    if (entry) void destroyEntry(entry);
  }
}

/**
 * Warm a full express session (LIST + CheckoutWeb instance, NOT yet mounted) for these items so the
 * page opened next can skip the network round-trips and mount the ECE immediately. Idempotent per
 * identity; safe to call repeatedly (e.g. on hover/press). Fire-and-forget.
 */
export function prefetchExpressSession(
  config: ExpressConfig,
  items: CartItem[],
  currency: string,
): void {
  if (items.length === 0) return;
  evictExpired();
  // Prefetch is always for an express-only "buy it now" surface, so the identity excludes cart inputs
  // (amount/items): a hover at qty 1 and a page-open at qty 3 resolve to the SAME key and claim the
  // same warmed session — the amount difference is reconciled in place via express.update after mount.
  const key = expressSessionKey(config, items, currency, false);
  if (entries.has(key)) return;

  const entry: PrefetchEntry = {
    key,
    createdAt: Date.now(),
    handlers: { ...NOOP_HANDLERS },
    promise: (async () => {
      const { longId } = await createExpressSession(config, items, currency);
      const instance = await initCheckout({
        config,
        longId,
        preloadCards: false,
        onSubmitSuccess: (data) => entry.handlers.onSubmitSuccess(data),
        onSubmitError: (data) => entry.handlers.onSubmitError(data),
      });
      return { longId, instance };
    })(),
  };
  // Drop a failed build so a later hover can retry cleanly.
  entry.promise.catch(() => {
    if (entries.get(key) === entry) entries.delete(key);
  });

  entries.set(key, entry);
  enforceCap();
}

export interface ClaimedSession {
  createdAt: number;
  promise: Promise<{ longId: string; instance: CheckoutInstance }>;
  setHandlers: (
    onSubmitSuccess: OnSubmitSuccess,
    onSubmitError: OnSubmitError,
  ) => void;
}

/**
 * Take ownership of a prefetched session for `key`, if one exists and is still fresh. The caller now
 * OWNS the returned instance and must destroy it. Returns null on miss or stale entry — the caller
 * should then build a session the normal way.
 */
export function claimExpressSession(key: string): ClaimedSession | null {
  const entry = entries.get(key);
  if (!entry) return null;
  entries.delete(key);
  if (Date.now() - entry.createdAt > SESSION_TTL_MS) {
    void destroyEntry(entry);
    return null;
  }
  return {
    createdAt: entry.createdAt,
    promise: entry.promise,
    setHandlers: (onSubmitSuccess, onSubmitError) => {
      entry.handlers = { onSubmitSuccess, onSubmitError };
    },
  };
}

/**
 * Destroy every UNCLAIMED prefetched session and empty the cache. Claimed sessions have already been
 * removed from the map (the claiming hook owns and tears those down), so this only reaps the ones a
 * shopper warmed but never opened. Call when leaving the storefront so no CheckoutWeb/Stripe instance
 * lingers after the express UI unmounts.
 */
export function clearPrefetchedSessions(): void {
  for (const [key, entry] of entries) {
    entries.delete(key);
    void destroyEntry(entry);
  }
}
