import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import ShopChrome from "@/features/expressCheckout/components/ShopChrome";
import ChargeRefsBlock from "@/features/expressCheckout/components/ChargeRefsBlock";
import { useExpressCartStore } from "@/features/expressCheckout/store/expressCartStore";
import { useExpressCheckoutStore } from "@/features/expressCheckout/store/expressCheckoutStore";
import {
  hasDisplayableChargeRefs,
  mergeChargeRefs,
  parseChargeRefsFromSearch,
  type ExpressChargeRefs,
} from "@/features/expressCheckout/utils/chargeRefs";

export default function Failure() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const items = useExpressCartStore((s) => s.items);
  const setChargeRefs = useExpressCheckoutStore((s) => s.setChargeRefs);
  // Snapshot at mount: the unmount cleanup below clears the store copy, and StrictMode runs that
  // cleanup once on mount, which would otherwise drop the refs in dev.
  const [memoryChargeRefs] = useState(() => useExpressCheckoutStore.getState().lastChargeRefs);

  const urlChargeRefs = useMemo(
    () => parseChargeRefsFromSearch(searchParams),
    [searchParams],
  );
  const chargeRefs: ExpressChargeRefs = mergeChargeRefs(urlChargeRefs, memoryChargeRefs);
  const showChargeRefs = hasDisplayableChargeRefs(chargeRefs);

  useEffect(() => {
    return () => setChargeRefs(null);
  }, [setChargeRefs]);

  const retry = () => {
    if (items.length === 0) void navigate("/express");
    else void navigate("/express/checkout");
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
        {showChargeRefs && (
          <div className="receipt">
            <ChargeRefsBlock refs={chargeRefs} />
          </div>
        )}
        <div className="result-actions">
          <button type="button" className="btn btn-primary" onClick={retry}>
            Try again
          </button>
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => void navigate("/express/cart")}
          >
            Back to cart
          </button>
        </div>
        <p className="result-help">Still stuck? Reach us at hello@pageturner.shop</p>
      </div>
    </ShopChrome>
  );
}
