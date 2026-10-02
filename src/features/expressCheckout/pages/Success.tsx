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
import {
  CHARGE_REF_DISPLAY,
  hasChargeRefs,
  mergeChargeRefs,
  parseChargeRefsFromSearch,
  takeExpressSuccessStash,
  type ExpressChargeRefs,
  type ExpressSuccessStash,
} from "@/features/expressCheckout/utils/chargeRefs";

function claimSuccessStash(): ExpressSuccessStash | null {
  // Do NOT claim while in-memory lastOrder is still present — that happens on the brief soft-nav
  // to Success before the SDK's hard redirect, and consuming here would leave the reload empty.
  if (useExpressCartStore.getState().lastOrder) return null;
  return takeExpressSuccessStash();
}

function orderTotal(order: PlacedOrder): number {
  return order.expressOverrides?.total ?? order.total;
}

function redirectAmount(refs: ExpressChargeRefs): number | undefined {
  if (!refs.amount) return undefined;
  const n = Number(refs.amount);
  return Number.isNaN(n) ? undefined : n;
}

function ChargeRefsBlock({ refs }: Readonly<{ refs: ExpressChargeRefs }>) {
  return (
    <div className="receipt-charge-refs" data-testid="charge-refs">
      <div className="receipt-charge-refs-title">Charge details</div>
      {CHARGE_REF_DISPLAY.map(({ key, label }) => {
        const value = refs[key];
        if (!value) return null;
        return (
          <div key={key} className="receipt-charge-ref">
            <span>{label}</span>
            <code data-charge-ref={key}>{value}</code>
          </div>
        );
      })}
    </div>
  );
}

function OrderReceipt({
  order,
  total,
}: Readonly<{ order: PlacedOrder; total: number }>) {
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
        <span>Total paid</span>
        <span>${total.toFixed(2)}</span>
      </div>
    </>
  );
}

function RedirectReceipt({
  refs,
  total,
}: Readonly<{ refs: ExpressChargeRefs; total: number | undefined }>) {
  return (
    <>
      <div className="receipt-row receipt-head">
        <span>Payment succeeded</span>
        {refs.currency ? <span>{refs.currency}</span> : null}
      </div>
      {total != null && (
        <div className="receipt-total" style={{ borderTop: "none", paddingTop: 16 }}>
          <span>Total paid</span>
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
  const memoryChargeRefs = useExpressCheckoutStore((s) => s.lastChargeRefs);
  const setFinalExpressOrder = useExpressCheckoutStore((s) => s.setFinalExpressOrder);
  const setLiveExpressOrder = useExpressCheckoutStore((s) => s.setLiveExpressOrder);
  const setChargeRefs = useExpressCheckoutStore((s) => s.setChargeRefs);

  // Cold-load after a hard returnUrl redirect: Zustand is empty, but sessionStorage (stashed just
  // before the redirect) and/or the returnUrl query string still carry the receipt + charge ids.
  const [stashed] = useState(claimSuccessStash);
  const order: PlacedOrder | null = memoryOrder ?? stashed?.order ?? null;

  const urlChargeRefs = useMemo(
    () => parseChargeRefsFromSearch(searchParams),
    [searchParams],
  );
  const chargeRefs: ExpressChargeRefs = mergeChargeRefs(
    urlChargeRefs,
    mergeChargeRefs(memoryChargeRefs, stashed?.chargeRefs),
  );
  const showChargeRefs = hasChargeRefs(chargeRefs);

  useEffect(() => {
    // Bounce only on a true cold visit (no cart snapshot AND no charge identifiers).
    if (!order && !showChargeRefs) {
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
    showChargeRefs,
    fromCart,
    clear,
    navigate,
    setFinalExpressOrder,
    setLiveExpressOrder,
    setChargeRefs,
  ]);

  if (!order && !showChargeRefs) return null;

  const total = order ? orderTotal(order) : redirectAmount(chargeRefs);

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
          Order confirmed
        </div>
        <h1 className="result-title">You're all set. Happy reading.</h1>
        <p className="result-lead">
          {order
            ? "We've emailed your receipt and your books are being packed. Here's a peek at your order."
            : "Your payment went through. Charge details from the return URL are below for follow-up checks."}
        </p>

        <div className="receipt">
          {order ? (
            <OrderReceipt order={order} total={total ?? order.total} />
          ) : (
            <RedirectReceipt refs={chargeRefs} total={total} />
          )}
          {showChargeRefs && <ChargeRefsBlock refs={chargeRefs} />}
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
