import type {
  CheckoutInstance,
  ExpressDropInComponent,
  ExpressDropInProps,
} from "@/features/embeddedCheckout/types/checkout";
import {
  parseAllowedShippingCountries,
  type ExpressConfig,
} from "@/features/expressCheckout/constants/express";
import { CURRENCY } from "@/features/expressCheckout/store/expressCartStore";
import { isExpressState } from "@/features/expressCheckout/types/express";

const EXPRESS_COMPONENT = "express";

/**
 * Assembles the compound `shipping` config for `dropIn('express')` from the demo config, or `undefined`
 * when shipping is off. The comma-separated ISO-alpha-2 allowlist string is split into a normalized
 * array (trim/upper-case, keep 2-letter codes); an empty result is omitted (uncapped). The rate preset
 * is passed verbatim (already the SDK's major-unit shape).
 */
function buildExpressShipping(config: ExpressConfig): ExpressDropInProps["shipping"] | undefined {
  if (!config.shippingAddressRequired) {
    return undefined;
  }
  const allowedCountries = parseAllowedShippingCountries(config.allowedShippingCountries);
  return {
    rates: config.shippingRates,
    ...(allowedCountries.length > 0 ? { allowedCountries } : {}),
  };
}

// OPG `payment.reference` is REQUIRED on the express charge (the buyer's order ref / bank-statement
// descriptor, merchant-owned). A real storefront passes its own order id here; this demo has no order
// yet at mount time (the receipt id is minted only after approval), so it generates a stable per-mount
// reference. Uses Web Crypto — never Math.random — for a collision-free value.
function generateDemoPaymentReference(): string {
  const uuid =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `${Date.now()}-${crypto.getRandomValues(new Uint32Array(1))[0]}`;
  return `PT-${uuid}`;
}

// Mirrors the SDK's express:state phases; the slot reveals only on `ready`.
export type ExpressStatus = "loading" | "ready" | "unavailable" | "error";

export interface MountExpressOptions {
  amount: string;
  config: ExpressConfig;
  node: HTMLElement;
  onStatus: (status: ExpressStatus, error?: string) => void;
}

export interface MountedExpress {
  // Tears down the express:state subscription and removes the drop-in. Idempotent per mount.
  cleanup: () => void;
  // The live express handle (undefined only when the SDK declines to build one — e.g. walletMode
  // 'inline'). Callers keep it to push post-mount amount/currency changes via `express.update(...)`.
  express: ExpressDropInComponent | undefined;
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
): MountedExpress {
  const handleState = (data: unknown) => {
    if (!isExpressState(data)) return;
    if (data.phase === "error") onStatus("error", data.errorMessage);
    else onStatus(data.phase);
  };
  instance.on("express:state", handleState);

  const shipping = buildExpressShipping(config);
  const express = instance.dropIn(EXPRESS_COMPONENT, {
    // Express identity (clientId / country) is declared once at init (see initCheckout), not here.
    // The drop-in call carries only per-transaction data.
    amount,
    currency: CURRENCY,
    locale: config.locale,
    // Required per-transaction OPG payment.reference. A real integration passes its own order id here
    // (e.g. `paymentReference: order.id`); the demo generates one since no order exists yet at mount.
    paymentReference: generateDemoPaymentReference(),
    // ECE shipping: assembled from the QA config; omitted entirely when the opt-in is off.
    ...(shipping ? { shipping } : {}),
  });

  // The resolved reference is readable straight off the handle, synchronously and before the wallet
  // sheet opens — persist it here to reconcile the charge to the order you create post-approval. e.g.:
  // savePendingOrderReference(express?.paymentReference);
  express?.mount(node);

  return {
    cleanup: () => {
      instance.off("express:state", handleState);
      instance.remove(EXPRESS_COMPONENT);
    },
    express,
  };
}
