import { type RefObject } from "react";
import { useExpressConfigStore } from "@/features/expressCheckout/store/expressConfigStore";
import { useExpressCartStore, CURRENCY } from "@/features/expressCheckout/store/expressCartStore";
import { useExpressCheckoutStore } from "@/features/expressCheckout/store/expressCheckoutStore";
import {
  useCheckoutSession,
  type CheckoutSessionResult,
} from "@/features/expressCheckout/hooks/useCheckoutSession";

export type CheckoutSlots = CheckoutSessionResult;

/**
 * Checkout-page composition: ONE CheckoutWeb instance drives BOTH the express element and the card
 * form (see useCheckoutSession for why a single instance is required). This wrapper only injects the
 * checkout page's outcome handling — success/decline are published to the global outcome store, which
 * CheckoutView subscribes to (only while active) to drive the result pages. The instance/session
 * lifecycle, keep-alive TTL guard, express mount and card mount/reveal all live in useCheckoutSession.
 */
export function useCheckout(
  expressSlotRef: RefObject<HTMLDivElement | null>,
  cardSlotRef: RefObject<HTMLDivElement | null>,
  active: boolean,
): CheckoutSlots {
  const allowRealRedirect = useExpressConfigStore((s) => s.allowRealRedirect);
  const items = useExpressCartStore((s) => s.items);
  const setOutcome = useExpressCheckoutStore((s) => s.setOutcome);

  return useCheckoutSession({
    items,
    currency: CURRENCY,
    active,
    expressSlotRef,
    cardSlotRef,
    onSubmitSuccess: (data) => {
      setOutcome({ kind: "success", data });
      if (import.meta.env.DEV) console.log("[checkout] submit success (payload redacted)");
      // Express/card wallet callbacks proceed with the backend redirect only when true; false
      // suppresses it (demo default) — see checkout-web-stripe host callbacks.
      return allowRealRedirect;
    },
    onSubmitError: (data) => {
      setOutcome({ kind: "declined", data });
      if (import.meta.env.DEV) console.log("[checkout] submit error/decline (payload redacted)");
    },
  });
}
