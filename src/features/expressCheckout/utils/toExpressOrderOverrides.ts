import type { ExpressOrderOverrides } from "@/features/expressCheckout/store/expressCartStore";
import type { ExpressOrderDetails } from "@/features/expressCheckout/types/express";

/** Map a final `ExpressOrderDetails` into cart receipt overrides (commerce-only — no buyer PII). */
export function toExpressOrderOverrides(eo: ExpressOrderDetails): ExpressOrderOverrides {
  return {
    total: Number(eo.amount),
    ...(eo.shippingRate
      ? { shippingAmount: Number(eo.shippingRate.amount), shippingLabel: eo.shippingRate.name }
      : {}),
  };
}
