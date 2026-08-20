import { useNavigate } from "react-router-dom";
import ShopChrome from "@/features/expressCheckout/components/ShopChrome";
import { useExpressCartStore } from "@/features/expressCheckout/store/expressCartStore";

export default function Failure() {
  const navigate = useNavigate();
  const items = useExpressCartStore((s) => s.items);

  const retry = () => {
    if (items.length === 0) navigate("/express");
    else navigate("/express/checkout");
  };

  return (
    <ShopChrome>
      <div className="result-wrap">
        <div className="result-icon result-icon-fail">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
            <path d="M6 6l12 12M18 6L6 18" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" />
          </svg>
        </div>
        <div className="result-eyebrow" style={{ color: "var(--spark)" }}>
          Payment declined
        </div>
        <h1 className="result-title">That didn't go through.</h1>
        <p className="result-lead">
          Your payment couldn't be completed and you haven't been charged. Your cart is still saved,
          so give it another try or use a different method.
        </p>
        <div className="result-actions">
          <button type="button" className="btn btn-primary" onClick={retry}>
            Try again
          </button>
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => navigate("/express/cart")}
          >
            Back to cart
          </button>
        </div>
        <p className="result-help">Still stuck? Reach us at hello@pageturner.shop</p>
      </div>
    </ShopChrome>
  );
}
