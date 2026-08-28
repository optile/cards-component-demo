import { useEffect, useRef, useState, type RefObject } from "react";
import { useExpressConfigStore } from "@/features/expressCheckout/store/expressConfigStore";
import { totalOf, type CartItem } from "@/features/expressCheckout/store/expressCartStore";
import {
  createExpressSession,
  initCheckout,
  type InitCheckoutParams,
} from "@/features/expressCheckout/utils/expressSdk";
import {
  buildExpressProducts,
  mountExpressElement,
  type ExpressStatus,
} from "@/features/expressCheckout/units/expressElement";
import {
  claimExpressSession,
  expressSessionKey,
} from "@/features/expressCheckout/units/expressPrefetch";
import type {
  CheckoutInstance,
  ExpressDropInComponent,
} from "@/features/embeddedCheckout/types/checkout";
import {
  SESSION_TTL_MS,
  type ExpressConfig,
} from "@/features/expressCheckout/constants/express";
import type {
  OnSubmitSuccess,
  OnSubmitError,
} from "@/features/expressCheckout/types/express";

// Stripe card networks are grouped under this component name by the SDK.
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
  expressStatus: ExpressStatus;
  expressError?: string;
  // Derived from the single express:state signal (`phase === 'ready'`): drives the slide-down reveal.
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
 * The in-place `express.update(...)` payload for a post-mount amount change: re-price only, plus the
 * charge-body `products[]` re-push when the cart is being sent (`buildExpressProducts` returns undefined
 * when it is off), so the frozen cart still sums to the new amount (Σ products === amount at charge).
 */
function inPlaceExpressUpdate(config: ExpressConfig, items: CartItem[], amount: string) {
  const products = buildExpressProducts(config, items, amount);
  return products ? { amount, products } : { amount };
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
  // The cart-send toggle, pulled out as a primitive so the in-place update effect keys on the toggle
  // itself (not the whole `config` object identity).
  const sendProducts = config.sendProducts;

  // Latest amount, readable synchronously inside the async build. Lets a quantity tick that lands
  // WHILE the session is still building be reconciled the moment the element mounts (see below), so a
  // slow build can't leave the wallet sheet showing the amount from when the build started.
  const amountRef = useRef(amount);
  amountRef.current = amount;
  // Latest cart items, readable synchronously in the async build alongside `amountRef`. Lets the
  // mid-build reconcile rebuild a `products[]` that sums to the LATEST amount (not the build-time one)
  // when the cart is being sent.
  const itemsRef = useRef(items);
  itemsRef.current = items;
  // Latest config, read the same way — so the in-place update effect can rebuild `products` from the
  // current config WITHOUT taking the whole `config` object as an effect trigger (only `amount` and the
  // `sendProducts` toggle should re-fire it).
  const configRef = useRef(config);
  configRef.current = config;
  // The live express handle for an express-only surface, kept so a post-mount amount change is pushed
  // to the wallet sheet in place via express.update(). Null for card surfaces (they rebuild instead).
  const expressHandleRef = useRef<ExpressDropInComponent | null>(null);

  const [expressStatus, setExpressStatus] = useState<ExpressStatus>("loading");
  const [expressError, setExpressError] = useState<string | undefined>(undefined);
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
  // country, clientId, locale, currency — plus items/amount ONLY for a card surface). It's the same
  // string an express-only surface uses to claim a hover-prefetched session, so the two can never
  // drift. Passing `wantCard` as `includeCart` is the crux here: for an express-only surface the cart
  // inputs are excluded, so a quantity tick does NOT change the key and therefore does NOT rebuild the
  // instance — the amount is pushed to the live sheet via express.update() (effect below). A card
  // surface keeps them, so its LIST total still rebuilds on a cart edit. `allowRealRedirect` is
  // deliberately excluded (read fresh at submit via callbacksRef). `wantCard` and `staleEpoch` (force a
  // rebuild of an aged kept-alive session) extend that identity into the full rebuild key.
  // `sendProducts` is deliberately NOT in the key: the cart now rides the in-place update
  // (`update({ amount, products })`, effect below), so a quantity tick re-prices and re-pushes a cart
  // that still sums to the new amount without a remount.
  const prefetchKey = expressSessionKey(config, items, currency, wantCard);
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

        // Mount the express element. A SINGLE express:state subscription drives the slot's whole
        // lifecycle (loading → ready | unavailable | error). Reused by the PDP.
        const mounted = mountExpressElement(ci, {
          amount,
          config,
          items,
          node: expressNode,
          onStatus: (status, error) => {
            if (cancelled) return;
            setExpressStatus(status);
            setExpressError(error);
          },
        });
        cleanupExpress = mounted.cleanup;

        // Keep the handle so an express-only surface can push post-mount amount changes in place.
        // (Card surfaces rebuild on a cart edit, so no handle is retained there.)
        if (!wantCard) {
          expressHandleRef.current = mounted.express ?? null;
          // Reconcile a quantity tick that landed mid-build: the element mounted with the build-time
          // amount, so if a newer one has arrived, push it now (currency is fixed) rather than wait for
          // the next tick. When the cart is being sent, re-push `products` for the latest amount too, so
          // the frozen cart still sums to what the sheet now shows.
          if (mounted.express && amountRef.current && amountRef.current !== amount) {
            mounted.express.update(
              inPlaceExpressUpdate(configRef.current, itemsRef.current, amountRef.current),
            );
          }
        }

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
      // The handle dies with this instance; drop it so the update effect can't touch a torn-down sheet.
      expressHandleRef.current = null;
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

  // In-place amount update: for an express-only surface a quantity tick no longer rebuilds the
  // instance (see the key derivation above), so push the new amount straight to the live wallet sheet.
  // Currency is the fixed CURRENCY constant; the SDK reconciles the amount via
  // elements.update({ amount, currency }) internally, re-reading the unchanged currency attribute —
  // no teardown, no GET /express refetch. When the cart is being sent, push `products` in the SAME call
  // so the re-price and the frozen charge-body cart stay consistent (Σ products === amount at charge) —
  // this is why `sendProducts` no longer forces a remount. `amount` is the reactive trigger (it tracks
  // the cart total); `items`/`config` are read fresh. On first mount the handle is still null (the
  // build is async), so this correctly no-ops until an actual post-mount change. Card surfaces rebuild
  // instead.
  useEffect(() => {
    if (wantCard || !amount) return;
    // `amount` and the `sendProducts` toggle are the triggers; the cart/config are read via refs so a
    // fresh `items` array or an unrelated `config` change never re-fires this (or churns a push).
    const products = sendProducts
      ? buildExpressProducts(configRef.current, itemsRef.current, amount)
      : undefined;
    expressHandleRef.current?.update(products ? { amount, products } : { amount });
  }, [amount, wantCard, sendProducts]);

  // Availability = the single signal reached its `ready` phase; drives the surrounding reveal.
  const expressAvailable = expressStatus === "ready";
  return { expressStatus, expressError, expressAvailable, cardStatus, cardError };
}
