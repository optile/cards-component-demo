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
  countOf,
  subtotalOf,
  useExpressCartStore,
  type CartItem,
} from "@/features/expressCheckout/store/expressCartStore";
import {
  isExpressState,
  isExpressOrderDetails,
  type ExpressOrderDetails,
} from "@/features/expressCheckout/types/express";

const EXPRESS_COMPONENT = "express";

type ExpressShippingConfig = NonNullable<ExpressDropInProps["shipping"]>;
type ExpressShippingResolver = NonNullable<ExpressShippingConfig["onShippingAddressChange"]>;

/**
 * Builds the OPT-IN dynamic `onShippingAddressChange` resolver for QA. Prices from BOTH the
 * buyer's COARSE address AND the LIVE cart (read at call time, not captured at mount) — the way a real
 * integration sizes a rate against its own order:
 *   • address (`country`/`state`) → region base rate: a US buyer gets "regional"/"express" tiers, everyone
 *     else a flat international rate; a known-unserviceable region (US/AK) returns `{ unserviceable: true }`.
 *   • cart item COUNT → a per-extra-item handling surcharge (books carry no weight, so count proxies weight).
 *   • cart SUBTOTAL → a value-based discount tier (bigger orders ship cheaper; floored so it can reach free).
 * An optional artificial delay exercises the SDK's timeout→static-fallback path on-device. It never throws
 * (a throw is treated as an error and falls back to the static preset). NOTE: the resolver only re-runs on an
 * ADDRESS change, so a cart edit made without touching the address won't re-quote until the next address
 * change (the base amount still updates in place via `express.update`). Not for production — a real
 * integration fetches rates from its own backend, keyed by its own order/session reference.
 */
function buildDynamicRatesResolver(config: ExpressConfig): ExpressShippingResolver {
  const delayMs = Math.max(0, config.dynamicRatesDelayMs);
  // Resolve now, or after the artificial latency knob — shared by both the reject and the priced arm.
  const settle = (
    value: Awaited<ReturnType<ExpressShippingResolver>>,
  ): ReturnType<ExpressShippingResolver> =>
    delayMs === 0
      ? value
      : new Promise((resolve) => setTimeout(() => resolve(value), delayMs));

  return (address) => {
    const country = (address.country ?? "").toUpperCase();
    const state = (address.state ?? "").toUpperCase();

    // A deliberately unserviceable region to exercise the reject path in the sheet.
    if (country === "US" && state === "AK") {
      return settle({ unserviceable: true });
    }

    // Price off the LIVE cart: item COUNT proxies weight (first book at base, each extra adds handling),
    // and SUBTOTAL proxies order value (a discount tier that grows with the order, floored at 0 so a big
    // order can ship free). Both feed every tier below, so the quote reacts to the cart AND the address.
    const items = useExpressCartStore.getState().items;
    const handling = Math.max(0, countOf(items) - 1) * 1.5;
    const subtotal = subtotalOf(items);
    let valueDiscount = 0;
    if (subtotal >= 75) valueDiscount = 5;
    else if (subtotal >= 40) valueDiscount = 2;
    const priced = (base: number): string =>
      Math.max(0, base + handling - valueDiscount).toFixed(2);

    const rates =
      country === "US"
        ? [
            { code: "dyn-regional", amount: priced(4.49), name: "Dynamic Regional", deliveryEstimate: "3-5 business days" },
            { code: "dyn-express", amount: priced(14.49), name: "Dynamic Express", deliveryEstimate: "1-2 business days" },
          ]
        : [{ code: "dyn-intl", amount: priced(34.49), name: "Dynamic International", deliveryEstimate: "7-14 business days" }];

    return settle({ rates });
  };
}

/**
 * Assembles the compound `shipping` config for `dropIn('express')` from the demo config, or `undefined`
 * when shipping is off. The comma-separated ISO-alpha-2 allowlist string is split into a normalized
 * array (trim/upper-case, keep 2-letter codes); an empty result is omitted (uncapped). The rate preset
 * is passed verbatim (already the SDK's major-unit shape). When the dynamic-rates QA toggle is on, an
 * opt-in `onShippingAddressChange` resolver (see {@link buildDynamicRatesResolver}) is attached; when
 * dynamic-ONLY is also on, the static preset is omitted so the resolver alone enables shipping (no
 * static fallback — a resolver failure/empty then rejects the address).
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
  // Dynamic-only (QA): with the resolver on, omit the static preset entirely so shipping is enabled by
  // the resolver ALONE. There is then no fallback, so a resolver failure/empty rejects the address.
  const dynamicOnly = config.dynamicRates && config.dynamicOnlyOmitRates;
  return {
    // The static preset stays the guaranteed fallback UNLESS dynamic-only omits it.
    ...(dynamicOnly ? {} : { rates: config.shippingRates }),
    ...(allowedCountries.length > 0 ? { allowedCountries } : {}),
    ...(config.dynamicRates ? { onShippingAddressChange: buildDynamicRatesResolver(config) } : {}),
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

// `payment.reference` is REQUIRED on the express charge (the buyer's order ref / bank-statement
// descriptor, merchant-owned). A real storefront passes its own order id here; this demo has no order
// yet at mount time (the receipt id is minted only after approval), so it generates a stable per-mount
// reference.
function generateDemoPaymentReference(): string {
  return `PT-${demoUuid()}`;
}

// `transactionId` is REQUIRED on the express charge — the merchant's own transaction identifier and
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
  // Live express:order snapshot (provisional while the sheet is open, final after charge). Display-only:
  // callers MUST NOT call express.update from within this callback.
  onOrder?: (order: ExpressOrderDetails) => void;
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
  { amount, config, items, node, onStatus, onOrder }: MountExpressOptions,
): MountedExpress {
  const handleState = (data: unknown) => {
    if (!isExpressState(data)) return;
    if (data.phase === "error") onStatus("error", data.errorMessage);
    else onStatus(data.phase);
  };
  instance.on("express:state", handleState);

  const handleOrder = onOrder
    ? (data: unknown) => {
        if (isExpressOrderDetails(data)) onOrder(data);
      }
    : undefined;
  if (handleOrder) instance.on("express:order", handleOrder);

  const shipping = buildExpressShipping(config);
  const products = buildExpressProducts(config, items, amount);
  const express = instance.dropIn(EXPRESS_COMPONENT, {
    // Express identity (clientId / country) is declared once at init (see initCheckout), not here.
    // The drop-in call carries only per-transaction data.
    amount,
    currency: CURRENCY,
    locale: config.locale,
    // Required per-transaction payment.reference. A real integration passes its own order id here
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
      if (handleOrder) instance.off("express:order", handleOrder);
      instance.remove(EXPRESS_COMPONENT);
    },
    express,
  };
}
