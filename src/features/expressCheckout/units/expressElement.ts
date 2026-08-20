import type { CheckoutInstance } from "@/features/embeddedCheckout/types/checkout";
import type { ExpressConfig } from "@/features/expressCheckout/constants/express";
import { CURRENCY } from "@/features/expressCheckout/store/expressCartStore";
import {
  isWalletsAvailability,
  type WalletsAvailability,
} from "@/features/expressCheckout/types/express";

const EXPRESS_COMPONENT = "express";

export type ExpressStatus = "loading" | "ready" | "error";

export interface MountExpressOptions {
  amount: string;
  config: ExpressConfig;
  node: HTMLElement;
  onStatus: (status: ExpressStatus, error?: string) => void;
  onAvailability: (a: WalletsAvailability) => void;
}

/**
 * Mounts the Express Checkout Element on a GIVEN CheckoutWeb instance and returns a cleanup.
 *
 * INSTANCE-AGNOSTIC: it never creates or destroys the instance — the caller (useCheckoutSession)
 * owns that lifecycle. This is what lets the checkout page share ONE instance across express + card
 * (required by the SDK's per-account Stripe singleton) while the book-detail page uses
 * its own instance, with zero duplicated express lifecycle code.
 *
 * The element is displayed as soon as it mounts (Stripe manages its own wallet detection and the
 * element's own visibility); `wallets:availability` only drives the surrounding slide-down reveal.
 */
export function mountExpressElement(
  instance: CheckoutInstance,
  { amount, config, node, onStatus, onAvailability }: MountExpressOptions,
): () => void {
  const handleAvailability = (data: unknown) => {
    if (isWalletsAvailability(data)) onAvailability(data);
  };
  instance.on("wallets:availability", handleAvailability);

  instance
    .dropIn(EXPRESS_COMPONENT, {
      amount,
      currency: CURRENCY,
      country: config.country,
      clientId: config.clientId,
      locale: config.locale,
      // OPG `payment.reference` (merchant order ref). The express one-step `/charge` REQUIRES it —
      // a null value is rejected as "payment.shortReference must not be null" (ABORT). A real
      // integration passes its own order id; the demo generates a unique one per mount.
      paymentReference: `Demo-${crypto.randomUUID()}`,
    })
    ?.mount(node);

  // Show the element immediately; Stripe renders its own loading + wallet buttons inside it.
  onStatus("ready");

  return () => {
    instance.off("wallets:availability", handleAvailability);
    instance.remove(EXPRESS_COMPONENT);
  };
}
