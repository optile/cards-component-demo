import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import ShopChrome from "@/features/expressCheckout/components/ShopChrome";
import {
  useExpressCartStore,
  countOf,
  shippingOf,
  type PlacedOrder,
} from "@/features/expressCheckout/store/expressCartStore";
import { useExpressCheckoutStore } from "@/features/expressCheckout/store/expressCheckoutStore";
import ChargeRefsBlock from "@/features/expressCheckout/components/ChargeRefsBlock";
import {
  hasChargeRefs,
  hasDisplayableChargeRefs,
  mergeChargeRefs,
  parseChargeRefsFromSearch,
  stashMatchesUrlRefs,
  takeExpressSuccessStash,
  type ExpressChargeRefs,
  type ExpressSuccessStash,
} from "@/features/expressCheckout/utils/chargeRefs";

function claimSuccessStash(urlRefs: ExpressChargeRefs): ExpressSuccessStash | null {
  // Do NOT claim while in-memory lastOrder is still present — that happens on the brief soft-nav
  // to Success before the SDK's hard redirect, and consuming here would leave the reload empty.
  if (useExpressCartStore.getState().lastOrder) return null;
  const stash = takeExpressSuccessStash();
  return stash && stashMatchesUrlRefs(stash.chargeRefs, urlRefs) ? stash : null;
}

type SuccessKind = "preset" | "order" | "charge" | "unknown";

const SUCCESS_COPY: Record<
  SuccessKind,
  { eyebrow: string; title: string; lead: string; receiptHead: string; totalLabel: string }
> = {
  preset: {
    eyebrow: "Preset created",
    title: "Authorized. Not charged yet.",
    lead: "The wallet authorized this order as a two-step preset. No money moved; the merchant completes it server-side.",
    receiptHead: "Preset created",
    totalLabel: "Total authorized",
  },
  order: {
    eyebrow: "Order confirmed",
    title: "You're all set. Happy reading.",
    lead: "We've emailed your receipt and your books are being packed. Here's a peek at your order.",
    receiptHead: "Payment succeeded",
    totalLabel: "Total paid",
  },
  charge: {
    eyebrow: "Order confirmed",
    title: "You're all set. Happy reading.",
    lead: "Your payment went through. Payment details are below for follow-up checks.",
    receiptHead: "Payment succeeded",
    totalLabel: "Total paid",
  },
  // No order and no operation type (e.g. a cold returnUrl load), so charge vs preset is unknown.
  unknown: {
    eyebrow: "Back from checkout",
    title: "Thanks for your order.",
    lead: "Details from the return URL are below for follow-up checks.",
    receiptHead: "Return details",
    totalLabel: "Total",
  },
};

function successKind(refs: ExpressChargeRefs, hasOrder: boolean): SuccessKind {
  if (refs.operationType === "PRESET") return "preset";
  if (hasOrder) return "order";
  return refs.operationType === "CHARGE" ? "charge" : "unknown";
}

function orderTotal(order: PlacedOrder): number {
  return order.expressOverrides?.total ?? order.total;
}

function redirectAmount(refs: ExpressChargeRefs): number | undefined {
  if (!refs.amount) return undefined;
  const n = Number(refs.amount);
  return Number.isNaN(n) ? undefined : n;
}

function OrderReceipt({
  order,
  total,
  totalLabel,
}: Readonly<{ order: PlacedOrder; total: number; totalLabel: string }>) {
  const eo = order.expressOverrides;
  const count = countOf(order.items);
  const shipping = eo?.shippingAmount ?? shippingOf(order.items);
  const shippingLabel = eo?.shippingLabel;

  return (
    <>
      <div className="receipt-row receipt-head">
        <span>Order {order.id}</span>
        <span>
          {count} {count === 1 ? "item" : "items"}
        </span>
      </div>
      <div className="receipt-items">
        {order.items.map((i) => (
          <div key={i.id} className="receipt-item">
            <span>
              {i.title}
              {i.quantity > 1 ? ` × ${i.quantity}` : ""}
            </span>
            <span>${(i.price * i.quantity).toFixed(2)}</span>
          </div>
        ))}
        <div className="receipt-item">
          <span>Shipping{shippingLabel ? ` (${shippingLabel})` : ""}</span>
          <span>{shipping > 0 ? `$${shipping.toFixed(2)}` : "On us"}</span>
        </div>
      </div>
      <div className="receipt-total">
        <span>{totalLabel}</span>
        <span>${total.toFixed(2)}</span>
      </div>
    </>
  );
}

function RedirectReceipt({
  refs,
  total,
  head,
  totalLabel,
}: Readonly<{
  refs: ExpressChargeRefs;
  total: number | undefined;
  head: string;
  totalLabel: string;
}>) {
  return (
    <>
      <div className="receipt-row receipt-head">
        <span>{head}</span>
        {refs.currency ? <span>{refs.currency}</span> : null}
      </div>
      {total != null && (
        <div className="receipt-total" style={{ borderTop: "none", paddingTop: 16 }}>
          <span>{totalLabel}</span>
          <span>${total.toFixed(2)}</span>
        </div>
      )}
    </>
  );
}

export default function Success() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const memoryOrder = useExpressCartStore((s) => s.lastOrder);
  const fromCart = useExpressCartStore((s) => s.lastOrderFromCart);
  const clear = useExpressCartStore((s) => s.clear);
  // Snapshot at mount: the unmount cleanup below clears the store copy, and StrictMode runs that
  // cleanup once on mount, which would otherwise drop the refs (and the preset heading) in dev.
  const [memoryChargeRefs] = useState(() => useExpressCheckoutStore.getState().lastChargeRefs);
  const setFinalExpressOrder = useExpressCheckoutStore((s) => s.setFinalExpressOrder);
  const setLiveExpressOrder = useExpressCheckoutStore((s) => s.setLiveExpressOrder);
  const setChargeRefs = useExpressCheckoutStore((s) => s.setChargeRefs);

  // Cold-load after a hard returnUrl redirect: Zustand is empty, but sessionStorage (stashed just
  // before the redirect) and/or the returnUrl query string still carry the receipt + charge ids.
  const urlChargeRefs = useMemo(
    () => parseChargeRefsFromSearch(searchParams),
    [searchParams],
  );
  const [stashed] = useState(() => claimSuccessStash(urlChargeRefs));
  const order: PlacedOrder | null = memoryOrder ?? stashed?.order ?? null;

  const chargeRefs: ExpressChargeRefs = mergeChargeRefs(
    urlChargeRefs,
    mergeChargeRefs(memoryChargeRefs, stashed?.chargeRefs),
  );
  const hasChargeIds = hasChargeRefs(chargeRefs);

  useEffect(() => {
    // Bounce only on a true cold visit (no cart snapshot AND no charge identifiers).
    if (!order && !hasChargeIds) {
      void navigate("/express", { replace: true });
      return;
    }
    if (order && fromCart) clear();
    // Clear only the live/final express holders on unmount. The receipt's own snapshot lives in
    // `lastOrder.expressOverrides` (memory-only, never persisted) and MUST survive here: clearing it on
    // unmount corrupts the receipt under React StrictMode's mount→cleanup→remount, and breaks re-viewing
    // the page. It is overwritten by the next placed order. Charge refs from the URL stay readable via
    // searchParams even after we clear the in-memory copy.
    return () => {
      setFinalExpressOrder(null);
      setLiveExpressOrder(null);
      setChargeRefs(null);
    };
  }, [
    order,
    hasChargeIds,
    fromCart,
    clear,
    navigate,
    setFinalExpressOrder,
    setLiveExpressOrder,
    setChargeRefs,
  ]);

  if (!order && !hasChargeIds) return null;

  const total = order ? orderTotal(order) : redirectAmount(chargeRefs);
  const copy = SUCCESS_COPY[successKind(chargeRefs, order != null)];

  return (
    <ShopChrome>
      <div className="result-wrap">
        <div className="result-icon result-icon-ok">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
            <path
              d="M5 13l4 4L19 7"
              stroke="#fff"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <div className="result-eyebrow" style={{ color: "var(--leaf)" }}>
          {copy.eyebrow}
        </div>
        <h1 className="result-title">{copy.title}</h1>
        <p className="result-lead">{copy.lead}</p>

        <div className="receipt">
          {order ? (
            <OrderReceipt order={order} total={total ?? order.total} totalLabel={copy.totalLabel} />
          ) : (
            <RedirectReceipt
              refs={chargeRefs}
              total={total}
              head={copy.receiptHead}
              totalLabel={copy.totalLabel}
            />
          )}
          {hasDisplayableChargeRefs(chargeRefs) && <ChargeRefsBlock refs={chargeRefs} />}
        </div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => void navigate("/express")}
        >
          Back to browsing
        </button>
      </div>
    </ShopChrome>
  );
}
