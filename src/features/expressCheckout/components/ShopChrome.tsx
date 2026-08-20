import { useNavigate } from "react-router-dom";
import ConfigSheet from "@/features/expressCheckout/components/ConfigSheet";
import { useExpressCartStore, countOf } from "@/features/expressCheckout/store/expressCartStore";

// Height of the global Payoneer header (fixed, min-h-[60px]) that sits above the shop.
const PAYONEER_HEADER_OFFSET = 60;

/**
 * PageTurner shop chrome: sticky header (brand + Browse + Cart) wrapping each themed view.
 * Rendered below the global Payoneer header, so it is pushed down by that header's height and its
 * own sticky header sticks just beneath it. The ⚙ ConfigSheet FAB is a demo/QA tool layered on
 * top — not part of the pixel-perfect design.
 */
export default function ShopChrome({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const items = useExpressCartStore((s) => s.items);
  const count = countOf(items);

  return (
    <div data-flow="express" style={{ paddingTop: PAYONEER_HEADER_OFFSET }}>
      <div className="app">
        <header className="header" style={{ top: PAYONEER_HEADER_OFFSET }}>
          <button type="button" className="brand" onClick={() => navigate("/express")}>
            <span className="brand-mark">
              Page<em>Turner</em>
            </span>
            <span className="brand-tag">Good reads, fast</span>
          </button>
          <div className="header-right">
            <button type="button" className="ghost-btn" onClick={() => navigate("/express")}>
              Browse
            </button>
            <button type="button" className="cart-btn" onClick={() => navigate("/express/cart")}>
              <span>Cart</span>
              <span className="cart-count">{count > 0 ? count : ""}</span>
            </button>
          </div>
        </header>

        <div className="pt-main">
          <div className="view active">{children}</div>
        </div>
      </div>

      <ConfigSheet />
    </div>
  );
}
