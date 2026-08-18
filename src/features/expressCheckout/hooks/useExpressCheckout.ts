import { useEffect, useState, type RefObject } from "react";
import { useExpressConfigStore } from "@/features/expressCheckout/store/expressConfigStore";
import { useExpressShopStore } from "@/features/expressCheckout/store/expressShopStore";
import { useExpressCheckoutStore } from "@/features/expressCheckout/store/expressCheckoutStore";
import { createExpressSession, initExpressCheckout } from "@/features/expressCheckout/utils/expressSdk";
import { getBook } from "@/features/expressCheckout/constants/books";
import { isWalletsAvailability } from "@/features/expressCheckout/types/express";
import type { CheckoutInstance } from "@/features/embeddedCheckout/types/checkout";

export function useExpressCheckout(slotRef: RefObject<HTMLDivElement | null>) {
  const config = useExpressConfigStore();
  const reinitSignature = config.getReinitSignature();
  const { currentBookId, quantity, currency } = useExpressShopStore();
  const book = getBook(currentBookId ?? undefined);
  const amount = book ? (book.price * quantity).toFixed(2) : undefined;

  const { status, error, setCheckout, setStatus, setAvailability, setOutcome } =
    useExpressCheckoutStore();
  const [available, setAvailableLocal] = useState(false);

  // One signature drives ONE rebuild effect. Splitting into re-init + mount effects created three
  // hazards: (1) country changed the element attribute but never regenerated the authoritative LIST
  // session; (2) a re-init never destroyed the previously committed CheckoutWeb, leaking instances +
  // wallet listeners across every quantity/wallet/env change and on unmount; (3) the two cleanups
  // could call off/remove on a just-destroyed instance and throw.
  //
  // A single rebuild that fully tears down and rebuilds fixes all three. Session-affecting inputs
  // (env, wallet config, book, quantity, currency, country) MUST regenerate the session; passthrough
  // inputs (clientId, locale) also force a rebuild here — a harmless extra remount for a demo that
  // buys race-free teardown. Because each rebuild is a fresh instance, there is no cached express
  // drop-in to evict on the happy path.
  const rebuildKey = [
    reinitSignature,
    config.country,
    config.clientId,
    config.locale,
    currentBookId,
    quantity,
    currency,
  ].join("|");

  useEffect(() => {
    if (!book || !amount) return;
    const node = slotRef.current;
    if (!node) return;

    let cancelled = false;
    let instance: CheckoutInstance | null = null;

    const onAvailability = (data: unknown) => {
      // Bus payload is the raw availability object (see isWalletsAvailability in Task 1).
      if (!isWalletsAvailability(data)) return;
      setAvailability(data);
      setAvailableLocal(data.available === true);
    };

    setStatus("loading");
    setAvailableLocal(false);
    setAvailability(null);

    (async () => {
      try {
        const { longId } = await createExpressSession(config, book, quantity, currency);
        const ci = await initExpressCheckout({
          config,
          longId,
          onSubmitSuccess: (data) => {
            setOutcome({ kind: "success", data });
            console.log("[express] submit success", data);
            // NOTE (verify during Task 10 smoke): the intent is "false ⇒ suppress the real redirect"
            // so the demo never completes a live charge by default. Confirm the express element reads
            // the boolean this way; flip if its contract is the inverse.
            return config.allowRealRedirect ? true : false;
          },
          onSubmitError: (data) => {
            setOutcome({ kind: "declined", data });
            console.log("[express] submit error/decline", data);
          },
        });
        if (cancelled) {
          ci.destroy();
          return;
        }
        instance = ci;
        ci.on("wallets:availability", onAvailability);
        ci.dropIn("express", {
          amount,
          currency,
          country: config.country,
          clientId: config.clientId,
          locale: config.locale,
        })?.mount(node);
        setCheckout(ci);
        setStatus("ready");
      } catch (e) {
        if (cancelled) return;
        setStatus("error", e instanceof Error ? e.message : "Failed to initialise express checkout");
      }
    })();

    return () => {
      cancelled = true;
      // Full teardown so no CheckoutWeb leaks across rebuilds or on unmount. Safe when the async
      // build lost the race (instance stays null) — the cancelled guard destroys the orphan above.
      instance?.off("wallets:availability", onAvailability);
      instance?.remove("express");
      instance?.destroy();
      setCheckout(null);
    };
    // rebuildKey encodes every dependency; fields are read fresh inside the effect body.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rebuildKey]);

  return { status, error, available };
}
