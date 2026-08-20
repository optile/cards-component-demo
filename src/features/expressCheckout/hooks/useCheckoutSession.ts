import { useEffect, useRef, useState, type RefObject } from "react";
import { useExpressConfigStore } from "@/features/expressCheckout/store/expressConfigStore";
import { totalOf, type CartItem } from "@/features/expressCheckout/store/expressCartStore";
import {
  createExpressSession,
  initCheckout,
  type InitCheckoutParams,
} from "@/features/expressCheckout/utils/expressSdk";
import { mountExpressElement } from "@/features/expressCheckout/units/expressElement";
import {
  claimExpressSession,
  expressSessionKey,
} from "@/features/expressCheckout/units/expressPrefetch";
import type { CheckoutInstance } from "@/features/embeddedCheckout/types/checkout";
import {
  SESSION_TTL_MS,
  type ExpressConfig,
} from "@/features/expressCheckout/constants/express";
import type {
  OnSubmitSuccess,
  OnSubmitError,
} from "@/features/expressCheckout/types/express";

// Stripe card networks are grouped under this component name by the SDK (see checkout-web
// getAvailableComponents -> createCardComponentItem).
const CARD_COMPONENT = "cards";

// Safety net: if the card `onReady` never arrives (unexpected SDK/network state), reveal anyway so
// the skeleton can't linger forever. Comfortably longer than a normal cold form load.
const READY_FALLBACK_MS = 8000;

type SlotStatus = "loading" | "ready" | "error";

export interface UseCheckoutSessionParams {
  items: CartItem[];
  currency: string;
  // The surface is on screen. Drives the keep-alive TTL guard; always true for the PDP.
  active: boolean;
  expressSlotRef: RefObject<HTMLDivElement | null>;
  // Provide to ALSO mount the classic card drop-in on the same instance (checkout page). Omit for
  // an express-only surface (book-detail buy-now).
  cardSlotRef?: RefObject<HTMLDivElement | null>;
  onSubmitSuccess: OnSubmitSuccess;
  onSubmitError: OnSubmitError;
}

export interface CheckoutSessionResult {
  expressStatus: SlotStatus;
  expressError?: string;
  expressAvailable: boolean;
  cardStatus: SlotStatus;
  cardError?: string;
}

interface AcquireInstanceArgs {
  wantCard: boolean;
  prefetchKey: string;
  config: ExpressConfig;
  items: CartItem[];
  currency: string;
  isCancelled: () => boolean;
  stampBuiltAt: (at: number) => void;
  submitHandlers: () => {
    onSubmitSuccess: OnSubmitSuccess;
    onSubmitError: OnSubmitError;
  };
  onComponentListChange?: InitCheckoutParams["onComponentListChange"];
  onReady?: InitCheckoutParams["onReady"];
}

/**
 * Obtain the CheckoutWeb instance to mount: for an express-only surface, claim a session prefetched on
 * hover/press (skipping the LIST + init round-trips) and only build fresh on a miss or if that
 * prefetched build failed. Returns null when the caller cancelled mid-build — any orphan instance is
 * destroyed here so nothing leaks. Kept out of the effect so its lifecycle stays easy to read.
 */
async function acquireExpressInstance(
  args: AcquireInstanceArgs,
): Promise<CheckoutInstance | null> {
  const { wantCard, prefetchKey, config, items, currency, isCancelled } = args;

  const claimed = wantCard ? null : claimExpressSession(prefetchKey);
  if (claimed) {
    try {
      const { instance } = await claimed.promise;
      if (isCancelled()) {
        instance.destroy();
        return null;
      }
      // The prefetched session was minted earlier; carry its age for the TTL guard, and route its
      // wallet outcome to the current page's handlers.
      args.stampBuiltAt(claimed.createdAt);
      const { onSubmitSuccess, onSubmitError } = args.submitHandlers();
      claimed.setHandlers(onSubmitSuccess, onSubmitError);
      return instance;
    } catch {
      // Prefetch build failed — fall through to a fresh build.
    }
  }

  const { longId } = await createExpressSession(config, items, currency);
  // Stamp session age for the keep-alive TTL guard (fresh session = clock reset).
  if (!isCancelled()) args.stampBuiltAt(Date.now());
  const { onSubmitSuccess, onSubmitError } = args.submitHandlers();
  const instance = await initCheckout({
    config,
    longId,
    preloadCards: wantCard,
    onSubmitSuccess,
    onSubmitError,
    onComponentListChange: args.onComponentListChange,
    onReady: args.onReady,
  });
  if (isCancelled()) {
    instance.destroy();
    return null;
  }
  return instance;
}

/**
 * Owns the SINGLE CheckoutWeb instance for a checkout surface and its LIST session, in ONE atomic
 * effect. Mounts the express element (always) and — when `cardSlotRef` is provided — the classic
 * card form, both on that one instance.
 *
 * A single instance per surface is required, not just tidy: the SDK caches a Stripe instance per
 * (publishableKey + connected account); mounting both drop-ins on one
 * instance keeps them coherent the way a real integration mounts multiple drop-ins. The express
 * mount is factored into the instance-agnostic `mountExpressElement` so the book-detail page can
 * reuse it on its OWN instance without duplicating any of this lifecycle.
 */
export function useCheckoutSession(
  params: UseCheckoutSessionParams,
): CheckoutSessionResult {
  const { items, currency, active, expressSlotRef, cardSlotRef } = params;
  const config = useExpressConfigStore();
  const total = totalOf(items);
  const amount = items.length > 0 ? total.toFixed(2) : undefined;
  const wantCard = Boolean(cardSlotRef);

  const [expressStatus, setExpressStatus] = useState<SlotStatus>("loading");
  const [expressError, setExpressError] = useState<string | undefined>(undefined);
  const [expressAvailable, setExpressAvailable] = useState(false);
  const [cardStatus, setCardStatus] = useState<SlotStatus>("loading");
  const [cardError, setCardError] = useState<string | undefined>(undefined);

  // Outcome callbacks are read through a ref so the SDK callbacks (captured once at build time) use
  // the LATEST handlers without forcing a session rebuild when the caller re-renders.
  const callbacksRef = useRef<{
    onSubmitSuccess: OnSubmitSuccess;
    onSubmitError: OnSubmitError;
  }>({ onSubmitSuccess: params.onSubmitSuccess, onSubmitError: params.onSubmitError });
  callbacksRef.current = {
    onSubmitSuccess: params.onSubmitSuccess,
    onSubmitError: params.onSubmitError,
  };

  // When the current session was minted (0 = nothing built). Drives the keep-alive staleness guard.
  const builtAtRef = useRef(0);
  // Bumped to force a rebuild when a kept-alive session has aged past SESSION_TTL_MS on reopen.
  const [staleEpoch, setStaleEpoch] = useState(0);

  // `expressSessionKey` is the SINGLE source for the session-affecting identity (env, wallet config,
  // country, clientId, locale, items, amount, currency) — the same string an express-only surface uses
  // to claim a hover-prefetched session, so the two can never drift. `allowRealRedirect` is deliberately
  // excluded (read fresh at submit via callbacksRef, so toggling it must not churn the session).
  // `wantCard` (card slot on/off) and `staleEpoch` (force a rebuild of an aged kept-alive session)
  // extend that identity into the full rebuild key.
  const prefetchKey = expressSessionKey(config, items, currency);
  const rebuildKey = JSON.stringify([prefetchKey, wantCard, staleEpoch]);

  // The signature the session is CURRENTLY built for. It only advances while the surface is ACTIVE,
  // so cart edits made while a kept-alive checkout is hidden (off-route) don't tear down and rebuild a
  // fresh LIST session on every edit. The session re-syncs to the latest inputs the next time the
  // surface is shown. Always-active surfaces (the PDP) track `rebuildKey` immediately.
  const [sessionKey, setSessionKey] = useState(rebuildKey);
  useEffect(() => {
    if (active && sessionKey !== rebuildKey) setSessionKey(rebuildKey);
  }, [active, rebuildKey, sessionKey]);

  // Keep-alive staleness guard: when the surface is reopened (active flips true) after its session
  // has aged past the TTL, force a fresh rebuild instead of paying against a likely-expired session.
  // Young sessions (and always-active surfaces like the PDP) fall through and re-display instantly.
  useEffect(() => {
    if (!active || builtAtRef.current === 0) return;
    if (Date.now() - builtAtRef.current > SESSION_TTL_MS) {
      setStaleEpoch((e) => e + 1);
    }
  }, [active]);

  useEffect(() => {
    if (!amount) return;
    const expressNode = expressSlotRef.current;
    if (!expressNode) return;
    const cardNode = cardSlotRef?.current ?? null;
    if (wantCard && !cardNode) return;

    let cancelled = false;
    let instance: CheckoutInstance | null = null;
    let cleanupExpress: (() => void) | null = null;
    let cardMounted = false;

    const revealCard = () => {
      if (!cancelled) setCardStatus("ready");
    };
    const cardFallback = wantCard
      ? window.setTimeout(revealCard, READY_FALLBACK_MS)
      : undefined;

    const mountCard = (ci: CheckoutInstance) => {
      if (cancelled || cardMounted || !wantCard || !cardNode) return;
      const hasCard = ci
        .availableDropInComponents()
        .some((m) => m.name === CARD_COMPONENT);
      if (!hasCard) return;
      ci.dropIn(CARD_COMPONENT, { hideSubmitButton: false }).mount(cardNode);
      cardMounted = true;
    };

    setExpressStatus("loading");
    setExpressError(undefined);
    setExpressAvailable(false);
    setCardStatus("loading");
    setCardError(undefined);

    (async () => {
      try {
        const ci = await acquireExpressInstance({
          wantCard,
          prefetchKey,
          config,
          items,
          currency,
          isCancelled: () => cancelled,
          stampBuiltAt: (at) => {
            builtAtRef.current = at;
          },
          submitHandlers: () => ({
            onSubmitSuccess: (data) => callbacksRef.current.onSubmitSuccess(data),
            onSubmitError: (data) => callbacksRef.current.onSubmitError(data),
          }),
          // Card-only signals: fires as list data resolves; mount the card form the moment it's
          // available and reveal it when the Stripe PaymentElement reports `ready`.
          onComponentListChange: wantCard
            ? (checkout) => mountCard(checkout)
            : undefined,
          onReady: wantCard ? () => revealCard() : undefined,
        });
        // Re-check cancellation once more: acquireExpressInstance's own isCancelled() guard ends the
        // instant before this continuation adopts `ci`. A teardown landing in that window already ran
        // while `instance`/`cleanupExpress` were still null, so it destroyed nothing — reap the orphan
        // here rather than mount an element the (already-run) cleanup can no longer reach.
        if (cancelled) {
          ci?.destroy();
          return;
        }
        // null = cancelled mid-build (the orphan, if any, was already destroyed).
        if (!ci) return;

        instance = ci;

        // Mount the express element (subscribes availability + reveals itself). Reused by the PDP.
        cleanupExpress = mountExpressElement(ci, {
          amount,
          config,
          node: expressNode,
          onStatus: (status, error) => {
            if (cancelled) return;
            setExpressStatus(status);
            setExpressError(error);
          },
          onAvailability: (a) => {
            if (!cancelled) setExpressAvailable(a.available === true);
          },
        });

        // The card component may already be available synchronously right after init.
        if (wantCard) mountCard(ci);
      } catch (e) {
        if (cancelled) return;
        const msg =
          e instanceof Error ? e.message : "Failed to initialise checkout";
        setExpressStatus("error");
        setExpressError(msg);
        setCardStatus("error");
        setCardError(msg);
      }
    })();

    return () => {
      cancelled = true;
      if (cardFallback) window.clearTimeout(cardFallback);
      // Atomic, ordered teardown (express → card → destroy), so nothing leaks across rebuilds or on
      // unmount. Safe when the async build lost the race (instance stays null): the cancelled guard
      // destroys the orphan in the async block above.
      cleanupExpress?.();
      instance?.remove(CARD_COMPONENT);
      instance?.destroy();
    };
    // sessionKey encodes every dependency (and gates rebuilds to when the surface is active); fields
    // are read fresh inside the effect body.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionKey]);

  return { expressStatus, expressError, expressAvailable, cardStatus, cardError };
}
