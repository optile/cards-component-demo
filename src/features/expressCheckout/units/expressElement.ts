import type {
  CheckoutInstance,
  ExpressDropInComponent,
  ExpressDropInProps,
} from "@/features/embeddedCheckout/types/checkout";
import {
  parseAllowedShippingCountries,
  type ExpressConfig,
} from "@/features/expressCheckout/constants/express";
import {
  CURRENCY,
  type CartItem,
} from "@/features/expressCheckout/store/expressCartStore";
import { isExpressState } from "@/features/expressCheckout/types/express";

const EXPRESS_COMPONENT = "express";

/**
 * Assembles the compound `shipping` config for `dropIn('express')` from the demo config, or `undefined`
 * when shipping is off. The comma-separated ISO-alpha-2 allowlist string is split into a normalized
 * array (trim/upper-case, keep 2-letter codes); an empty result is omitted (uncapped). The rate preset
 * is passed verbatim (already the SDK's major-unit shape).
 */
function buildExpressShipping(
  config: ExpressConfig,
): ExpressDropInProps["shipping"] | undefined {
  if (!config.shippingAddressRequired) {
    return undefined;
  }
  const allowedCountries = parseAllowedShippingCountries(
    config.allowedShippingCountries,
  );
  return {
    rates: config.shippingRates,
    ...(allowedCountries.length > 0 ? { allowedCountries } : {}),
  };
}

/**
 * Assembles the optional charge-body `products[]` for `dropIn('express')`, or `undefined` when the QA
 * toggle is off. Sends one line per cart item (`price × quantity`) plus a single remainder line for the
 * cart shipping fee when the drop-in `amount` exceeds the item subtotal, so the set sums EXACTLY to
 * `amount` (the SDK rejects a mismatch). All amounts are 2-dp major-unit strings, matching how the demo
 * derives `amount` (`Number#toFixed(2)`); a production integration would use minor-unit integers.
 */
export function buildExpressProducts(
  config: ExpressConfig,
  items: CartItem[],
  amount: string,
): ExpressDropInProps["products"] | undefined {
  if (!config.sendProducts || items.length === 0) {
    return undefined;
  }
  const lines: NonNullable<ExpressDropInProps["products"]> = items.map(
    (item) => ({
      code: `book-${item.id}`,
      name: item.title,
      // `amount` is the line total (unit × qty); `quantity` is descriptive and does not re-scale it.
      amount: (item.price * item.quantity).toFixed(2),
      quantity: item.quantity,
    }),
  );
  const itemsTotal = lines.reduce((sum, line) => sum + Number(line.amount), 0);
  const remainder = Number((Number(amount) - itemsTotal).toFixed(2));
  if (remainder > 0) {
    lines.push({
      code: "shipping-fee",
      name: "Shipping",
      amount: remainder.toFixed(2),
    });
  }
  return lines;
}

// Web Crypto UUID (never Math.random) for a collision-free demo id.
function demoUuid(): string {
  return typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `${Date.now()}-${crypto.getRandomValues(new Uint32Array(1))[0]}`;
}

// OPG `payment.reference` is REQUIRED on the express charge (the buyer's order ref / bank-statement
// descriptor, merchant-owned). A real storefront passes its own order id here; this demo has no order
// yet at mount time (the receipt id is minted only after approval), so it generates a stable per-mount
// reference.
function generateDemoPaymentReference(): string {
  return `PT-${demoUuid()}`;
}

// OPG `transactionId` is REQUIRED on the express charge — the merchant's own transaction identifier and
// the correlation key they use to reconcile the (post-authorization-validated) one-step charge against
// their order/ERP. A real integration passes the id from its own system; the demo has none, so it mints a
// stable per-mount id. The SDK enforces its presence at dropIn('express') time.
function generateDemoTransactionId(): string {
  return `TX-${demoUuid()}`;
}

// Mirrors the SDK's express:state phases; the slot reveals only on `ready`.
export type ExpressStatus = "loading" | "ready" | "unavailable" | "error";

export interface MountExpressOptions {
  amount: string;
  config: ExpressConfig;
  // Current cart items, used only to derive the optional charge-body `products[]` (summing to `amount`).
  items: CartItem[];
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
  { amount, config, items, node, onStatus }: MountExpressOptions,
): MountedExpress {
  const handleState = (data: unknown) => {
    if (!isExpressState(data)) return;
    if (data.phase === "error") onStatus("error", data.errorMessage);
    else onStatus(data.phase);
  };
  instance.on("express:state", handleState);

  const shipping = buildExpressShipping(config);
  const products = buildExpressProducts(config, items, amount);
  const express = instance.dropIn(EXPRESS_COMPONENT, {
    // Express identity (clientId / country) is declared once at init (see initCheckout), not here.
    // The drop-in call carries only per-transaction data.
    amount,
    currency: CURRENCY,
    locale: config.locale,
    // Required per-transaction OPG payment.reference. A real integration passes its own order id here
    // (e.g. `paymentReference: order.id`); the demo generates one since no order exists yet at mount.
    paymentReference: generateDemoPaymentReference(),
    // Required per-transaction merchant transactionId (reconciliation key). A real integration passes its
    // own id from its order/ERP system (e.g. `transactionId: order.txnId`); the demo mints one.
    transactionId: generateDemoTransactionId(),
    // ECE shipping: assembled from the QA config; omitted entirely when the opt-in is off.
    ...(shipping ? { shipping } : {}),
    // Charge-body cart products: omitted unless the QA toggle is on (see buildExpressProducts).
    ...(products ? { products } : {}),
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
