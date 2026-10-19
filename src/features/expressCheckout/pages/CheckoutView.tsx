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
} from "@/features/expressCheckout/store/expressCartStore";
import {
  BUYER_COUNTRIES,
  useExpressBuyerStore,
} from "@/features/expressCheckout/store/expressBuyerStore";
import {
  cardOrderOverrides,
  cardTotalOf,
  taxOf,
} from "@/features/expressCheckout/utils/cardTotals";
import { useExpressCheckoutStore } from "@/features/expressCheckout/store/expressCheckoutStore";
import { useExpressConfigStore } from "@/features/expressCheckout/store/expressConfigStore";
import { BOOKS } from "@/features/expressCheckout/constants/books";
import { receiptFromExpressOrder } from "@/features/expressCheckout/utils/receiptFromExpressOrder";
import {
  chargeRefsForOutcome,
  hasFollowableRedirect,
  stashExpressSuccess,
} from "@/features/expressCheckout/utils/chargeRefs";

/**
 * Buyer details for the card LIST (billing + est. tax country). Express keeps the ⚙ config-sheet
 * country and DEMO_* buyer. Owns the live-field subscriptions so a keystroke re-renders only the form.
 */
function BuyerDetails() {
  const email = useExpressBuyerStore((s) => s.email);
  const fullName = useExpressBuyerStore((s) => s.fullName);
  const country = useExpressBuyerStore((s) => s.country);
  const setEmail = useExpressBuyerStore((s) => s.setEmail);
  const setFullName = useExpressBuyerStore((s) => s.setFullName);
  const setCountry = useExpressBuyerStore((s) => s.setCountry);
  const commitBuyer = useExpressBuyerStore((s) => s.commit);
  const showHint = !email.trim() || !fullName.trim();

  return (
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
          autoComplete="email"
          className="form-input"
          placeholder="you@example.com"
          aria-describedby={showHint ? "co-details-hint" : undefined}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={() => commitBuyer()}
        />
      </div>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label" htmlFor="co-name">
            Full name
          </label>
          <input
            id="co-name"
            type="text"
            autoComplete="name"
            className="form-input"
            placeholder="Alex Reader"
            aria-describedby={showHint ? "co-details-hint" : undefined}
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            onBlur={() => commitBuyer()}
          />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="co-country">
            Shipping country
          </label>
          <select
            id="co-country"
            autoComplete="country"
            className="form-input"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
          >
            {BUYER_COUNTRIES.map(([code, name]) => (
              <option key={code} value={code}>
                {name}
              </option>
            ))}
          </select>
        </div>
      </div>
      <p id="co-details-hint" className="form-hint" aria-live="polite">
        {showHint ? "Add your email and name for the card receipt. Wallets still work." : ""}
      </p>
    </div>
  );
}

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

  const country = useExpressBuyerStore((s) => s.country);

  // Card totals (shipping + est. tax by buyer country). Live express shipping bypasses tax.
  const estTax = taxOf(items, country);
  const cartTotal = cardTotalOf(items, country);

  // When ECE shipping is on and the wallet sheet has sent a provisional order, prefer its shipping +
  // total over the cart's flat/free shippingOf/totalOf. Display-only: NEVER call express.update here.
  const hasLiveExpressShipping = shippingAddressRequired && liveExpressOrder?.shippingRate != null;
  const shipping = hasLiveExpressShipping
    ? Number(liveExpressOrder.shippingRate!.amount)
    : cartShipping;
  const total = hasLiveExpressShipping ? Number(liveExpressOrder.amount) : cartTotal;

  // ONE CheckoutWeb instance drives both drop-ins (see useCheckoutSession for why one instance is
  // the recommended model). It mounts the express element and the card form into these two slots.
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
        const cartItems = useExpressCartStore.getState().items;
        const receipt = receiptFromExpressOrder(
          eo,
          cartItems,
          BOOKS,
          useExpressConfigStore.getState().shippingAddressRequired,
        );
        // Card: totals of the country the LIST was priced for (est. tax). Express: the wallet's own
        // tax-free overrides.
        const { lastSuccessSource, cardListCountry } = useExpressCheckoutStore.getState();
        const overrides =
          lastSuccessSource === "card"
            ? cardOrderOverrides(
                cartItems,
                cardListCountry ?? useExpressBuyerStore.getState().country,
              )
            : receipt.overrides;
        const order = placeOrder(overrides, receipt.items);
        const chargeRefs =
          useExpressCheckoutStore.getState().lastChargeRefs ?? chargeRefsForOutcome(outcome.data);
        // Bridge the receipt across the hard returnUrl reload; only stash when the SDK will navigate,
        // or the unclaimed stash would decorate a later receipt.
        if (useExpressConfigStore.getState().allowRealRedirect && hasFollowableRedirect(outcome.data)) {
          stashExpressSuccess({ order, chargeRefs, fromCart: true });
        }
        navigate("/express/success");
      } else {
        navigate("/express/failure");
      }
    });
    return unsub;
  }, [active, navigate, placeOrder]);

  const completePurchase = () => {
    placeOrder(cardOrderOverrides(items, country));
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
          <BuyerDetails />

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
              <span>{shipping === 0 ? "Free*" : `$${shipping.toFixed(2)}`}</span>
            </div>
            {!hasLiveExpressShipping && (
              <div className="summary-row">
                <span>Est. tax</span>
                <span>${estTax.toFixed(2)}</span>
              </div>
            )}
            <div className="summary-total">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>
          {shipping === 0 && (
            <p className="summary-note" style={{ marginTop: -12 }}>
              * Free standard shipping over $50 — your final shipping is set by the
              address you enter at checkout.
            </p>
          )}
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
            <button
              type="button"
              onClick={() => {
                useExpressCheckoutStore.getState().setChargeRefs(null);
                navigate("/express/failure");
              }}
            >
              simulate a declined payment
            </button>
          </div>
        </div>
      </div>
    </ShopChrome>
  );
}
