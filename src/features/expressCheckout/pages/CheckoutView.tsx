import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import ShopChrome from "@/features/expressCheckout/components/ShopChrome";
import ExpressSlot from "@/features/expressCheckout/components/ExpressSlot";
import CardSlot from "@/features/expressCheckout/components/CardSlot";
import { useCheckout } from "@/features/expressCheckout/hooks/useCheckout";
import {
  useExpressCartStore,
  subtotalOf,
  shippingOf,
  totalOf,
} from "@/features/expressCheckout/store/expressCartStore";
import { useExpressCheckoutStore } from "@/features/expressCheckout/store/expressCheckoutStore";
import { useExpressConfigStore } from "@/features/expressCheckout/store/expressConfigStore";
import { toExpressOrderOverrides } from "@/features/expressCheckout/utils/toExpressOrderOverrides";

// Demo-only shipping options (matches the design). Not wired to the express session — the actual
// session country is controlled by the ⚙ config sheet.
const COUNTRIES: Array<[string, string]> = [
  ["US", "United States"],
  ["GB", "United Kingdom"],
  ["CA", "Canada"],
  ["AU", "Australia"],
  ["DE", "Germany"],
  ["IN", "India"],
  ["PH", "Philippines"],
  ["OTHER", "Somewhere else"],
];

/**
 * `active` = the checkout route is the one on screen. The surface is kept mounted (hidden) while
 * inactive for keep-alive (see ExpressChrome), so route-driven side effects — the empty-cart bounce
 * and the outcome→result-page navigation — must run ONLY when active; otherwise a hidden instance
 * would hijack navigation while the user is on another page.
 */
export default function CheckoutView({ active }: Readonly<{ active: boolean }>) {
  const navigate = useNavigate();
  const items = useExpressCartStore((s) => s.items);
  const placeOrder = useExpressCartStore((s) => s.placeOrder);
  const shippingAddressRequired = useExpressConfigStore((s) => s.shippingAddressRequired);
  const liveExpressOrder = useExpressCheckoutStore((s) => s.liveExpressOrder);

  const subtotal = subtotalOf(items);
  const cartShipping = shippingOf(items);
  const cartTotal = totalOf(items);

  // When ECE shipping is on and the wallet sheet has sent a provisional order, prefer its shipping +
  // total over the cart's flat/free shippingOf/totalOf. Display-only: NEVER call express.update here.
  const hasLiveExpressShipping = shippingAddressRequired && liveExpressOrder?.shippingRate != null;
  const shipping = hasLiveExpressShipping
    ? Number(liveExpressOrder.shippingRate!.amount)
    : cartShipping;
  const total = hasLiveExpressShipping ? Number(liveExpressOrder.amount) : cartTotal;

  // ONE CheckoutWeb instance drives both drop-ins (see useCheckout for why a single instance is
  // required). It mounts the express element and the card form into these two slots.
  const expressSlotRef = useRef<HTMLDivElement | null>(null);
  const cardSlotRef = useRef<HTMLDivElement | null>(null);
  const { expressStatus, expressError, expressAvailable, cardStatus, cardError } =
    useCheckout(expressSlotRef, cardSlotRef, active);

  // The express element mounts hidden (clipped, but still laid out) so Stripe can run its wallet
  // detection; we only slide the whole express block into view once it reports an available wallet.
  // No wallet → it stays collapsed, so there's no empty container and no dangling "or pay" divider.

  // A checkout with nothing to buy makes no sense — bounce back to the cart. Only while active, so a
  // kept-alive (hidden) instance can't yank the user off another page when the cart empties.
  useEffect(() => {
    if (active && items.length === 0) navigate("/express/cart", { replace: true });
  }, [active, items.length, navigate]);

  useEffect(() => {
    if (!active) return;
    useExpressCheckoutStore.getState().setOutcome(null);
    const unsub = useExpressCheckoutStore.subscribe((state, prev) => {
      const outcome = state.lastOutcome;
      if (!outcome || outcome === prev.lastOutcome) return;
      useExpressCheckoutStore.getState().setOutcome(null);
      if (outcome.kind === "success") {
        // Read finalExpressOrder (captured by useCheckout BEFORE setOutcome) and merge into order.
        const eo = useExpressCheckoutStore.getState().finalExpressOrder;
        placeOrder(eo ? toExpressOrderOverrides(eo) : undefined);
        navigate("/express/success");
      } else {
        navigate("/express/failure");
      }
    });
    return unsub;
  }, [active, navigate, placeOrder]);

  const completePurchase = () => {
    placeOrder();
    navigate("/express/success");
  };

  if (items.length === 0) return null;

  return (
    <ShopChrome>
      <button type="button" className="back-link" onClick={() => navigate("/express/cart")}>
        ← Back to cart
      </button>
      <div className="section-head" style={{ marginBottom: 28 }}>
        <h2 className="section-title">Checkout</h2>
      </div>

      <div className="checkout-page">
        {/* Left: customer details + order summary */}
        <div className="checkout-col">
          <div className="pay-section">
            <div className="pay-section-head">
              <span className="pay-section-title">Your details</span>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="co-email">
                Email
              </label>
              <input
                id="co-email"
                type="email"
                className="form-input"
                placeholder="you@example.com"
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="co-name">
                  Full name
                </label>
                <input id="co-name" type="text" className="form-input" placeholder="Alex Reader" />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="co-country">
                  Shipping country
                </label>
                <select id="co-country" className="form-input" defaultValue="US">
                  {COUNTRIES.map(([code, name]) => (
                    <option key={code} value={code}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="pay-section">
            <div className="pay-section-head">
              <span className="pay-section-title">Order summary</span>
            </div>
            <div className="receipt-items" style={{ paddingTop: 0 }}>
              {items.map((i) => (
                <div key={i.id} className="receipt-item">
                  <span>
                    {i.title}
                    {i.quantity > 1 ? ` × ${i.quantity}` : ""}
                  </span>
                  <span>${(i.price * i.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="summary-row">
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="summary-row">
              <span>Shipping</span>
              <span>{shipping === 0 ? "Free" : `$${shipping.toFixed(2)}`}</span>
            </div>
            <div className="summary-total">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Right: payment methods stacked — classic card first, express below */}
        <div className="checkout-col">
          <div className="pay-section">
            <div className="pay-section-head">
              <span className="pay-section-title">Card details</span>
            </div>
            {/* Real Payoneer card drop-in, mounted by the shared useCheckout instance. */}
            <CardSlot slotRef={cardSlotRef} status={cardStatus} error={cardError} />
          </div>

          <div className={`express-reveal${expressAvailable ? " is-visible" : ""}`}>
            <div className="express-reveal-inner">
              <div className="pay-or">or pay instantly</div>

              <div className="pay-section">
                <div className="pay-section-head">
                  <span className="pay-section-title">Express checkout</span>
                  <span className="pay-badge">Fastest</span>
                </div>
                <ExpressSlot slotRef={expressSlotRef} status={expressStatus} error={expressError} />
              </div>
            </div>
          </div>

          <div className="checkout-demo">
            <button type="button" onClick={completePurchase}>
              Demo: complete purchase
            </button>
            {" · "}
            <button type="button" onClick={() => navigate("/express/failure")}>
              simulate a declined payment
            </button>
          </div>
        </div>
      </div>
    </ShopChrome>
  );
}
