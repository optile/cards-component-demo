import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ShopChrome from "@/features/expressCheckout/components/ShopChrome";
import {
  useExpressCartStore,
  countOf,
  shippingOf,
} from "@/features/expressCheckout/store/expressCartStore";
import { useExpressCheckoutStore } from "@/features/expressCheckout/store/expressCheckoutStore";

export default function Success() {
  const navigate = useNavigate();
  const order = useExpressCartStore((s) => s.lastOrder);
  const fromCart = useExpressCartStore((s) => s.lastOrderFromCart);
  const clear = useExpressCartStore((s) => s.clear);
  const setFinalExpressOrder = useExpressCheckoutStore((s) => s.setFinalExpressOrder);
  const setLiveExpressOrder = useExpressCheckoutStore((s) => s.setLiveExpressOrder);

  useEffect(() => {
    if (!order) {
      navigate("/express", { replace: true });
      return;
    }
    if (fromCart) clear();
    // Clear only the live/final express holders on unmount. The receipt's own snapshot lives in
    // `lastOrder.expressOverrides` (memory-only, never persisted) and MUST survive here: clearing it on
    // unmount corrupts the receipt under React StrictMode's mount→cleanup→remount, and breaks re-viewing
    // the page. It is overwritten by the next placed order.
    return () => {
      setFinalExpressOrder(null);
      setLiveExpressOrder(null);
    };
  }, [order, fromCart, clear, navigate, setFinalExpressOrder, setLiveExpressOrder]);

  if (!order) return null;

  const eo = order.expressOverrides;
  const count = countOf(order.items);
  // Prefer express overrides for shipping + total when present (ECE shipping on); fall back to cart math.
  const shipping = eo?.shippingAmount ?? shippingOf(order.items);
  const shippingLabel = eo?.shippingLabel;
  const total = eo ? eo.total : order.total;

  const backToBrowsing = () => navigate("/express");

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
          We've emailed your receipt and your books are being packed. Here's a peek at your order.
        </p>

        <div className="receipt">
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
        </div>
        <button type="button" className="btn btn-primary" onClick={backToBrowsing}>
          Back to browsing
        </button>
      </div>
    </ShopChrome>
  );
}
