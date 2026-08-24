import type { CheckoutInstance } from "@/features/embeddedCheckout/types/checkout";
import type { ExpressConfig } from "@/features/expressCheckout/constants/express";
import { CURRENCY } from "@/features/expressCheckout/store/expressCartStore";
import { isExpressState } from "@/features/expressCheckout/types/express";

const EXPRESS_COMPONENT = "express";

// Mirrors the SDK's express:state phases; the slot reveals only on `ready`.
export type ExpressStatus = "loading" | "ready" | "unavailable" | "error";

export interface MountExpressOptions {
  amount: string;
  config: ExpressConfig;
  node: HTMLElement;
  onStatus: (status: ExpressStatus, error?: string) => void;
}

/**
 * Mounts the Express Checkout Element on a GIVEN CheckoutWeb instance and returns a cleanup.
 *
 * INSTANCE-AGNOSTIC: it never creates or destroys the instance — the caller (useCheckoutSession)
 * owns that lifecycle. This is what lets the checkout page share ONE instance across express + card
 * (required by the SDK's per-account Stripe singleton) while the book-detail page uses
 * its own instance, with zero duplicated express lifecycle code.
 *
 * The whole slot lifecycle is driven by a SINGLE `express:state` subscription and one switch —
 * `loading` shows the skeleton, `ready` reveals the element, and `unavailable`/`error` keep it hidden.
 * This single signal is the public host contract; the SDK's lower-level events stay internal to it.
 */
export function mountExpressElement(
  instance: CheckoutInstance,
  { amount, config, node, onStatus }: MountExpressOptions,
): () => void {
  const handleState = (data: unknown) => {
    if (!isExpressState(data)) return;
    if (data.phase === "error") onStatus("error", data.errorMessage);
    else onStatus(data.phase);
  };
  instance.on("express:state", handleState);

  instance
    .dropIn(EXPRESS_COMPONENT, {
      // Express identity (clientId / country) is declared once at init (see initCheckout), not here.
      // The drop-in call carries only per-transaction data.
      amount,
      currency: CURRENCY,
      locale: config.locale,
      // `payment.reference` (merchant order ref) is REQUIRED by the express one-step `/charge` — a
      // missing value is rejected by the backend. A real integration passes its own order id; the
      // demo generates a unique one per mount.
      paymentReference: `Demo-${crypto.randomUUID()}`,
    })
    ?.mount(node);

  return () => {
    instance.off("express:state", handleState);
    instance.remove(EXPRESS_COMPONENT);
  };
}
