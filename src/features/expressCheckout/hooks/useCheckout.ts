import { type RefObject } from "react";
import { useExpressConfigStore } from "@/features/expressCheckout/store/expressConfigStore";
import { useExpressCartStore, CURRENCY } from "@/features/expressCheckout/store/expressCartStore";
import { useExpressCheckoutStore } from "@/features/expressCheckout/store/expressCheckoutStore";
import {
  useCheckoutSession,
  type CheckoutSessionResult,
} from "@/features/expressCheckout/hooks/useCheckoutSession";
import { isExpressOrderDetails } from "@/features/expressCheckout/types/express";
import { chargeRefsForOutcome } from "@/features/expressCheckout/utils/chargeRefs";

export type CheckoutSlots = CheckoutSessionResult;

export function useCheckout(
  expressSlotRef: RefObject<HTMLDivElement | null>,
  cardSlotRef: RefObject<HTMLDivElement | null>,
  active: boolean,
): CheckoutSlots {
  const allowRealRedirect = useExpressConfigStore((s) => s.allowRealRedirect);
  const items = useExpressCartStore((s) => s.items);
  const setOutcome = useExpressCheckoutStore((s) => s.setOutcome);
  const setFinalExpressOrder = useExpressCheckoutStore((s) => s.setFinalExpressOrder);
  const setChargeRefs = useExpressCheckoutStore((s) => s.setChargeRefs);

  return useCheckoutSession({
    items,
    currency: CURRENCY,
    active,
    expressSlotRef,
    cardSlotRef,
    onSubmitSuccess: (data) => {
      // Capture expressOrder BEFORE setOutcome so it's available when the subscriber navigates.
      // Always set (including null) so a card success after a prior express attempt cannot reuse wallet overrides.
      const payload = data as Record<string, unknown> | null;
      const eo = payload?.expressOrder;
      setFinalExpressOrder(isExpressOrderDetails(eo) ? eo : null);
      // Soft-nav Success reads these; real redirect reloads and falls back to returnUrl query params.
      setChargeRefs(
        chargeRefsForOutcome(data, useExpressCheckoutStore.getState().hostChargeIds),
      );
      setOutcome({ kind: "success", data });
      if (import.meta.env.DEV) console.log("[checkout] submit success (payload redacted)");
      return allowRealRedirect;
    },
    onSubmitError: (data) => {
      setChargeRefs(
        chargeRefsForOutcome(data, useExpressCheckoutStore.getState().hostChargeIds),
      );
      setOutcome({ kind: "declined", data });
      if (import.meta.env.DEV) console.log("[checkout] submit error/decline (payload redacted)");
      return false;
    },
  });
}
