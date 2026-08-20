import { useNavigate } from "react-router-dom";
import ShopChrome from "@/features/expressCheckout/components/ShopChrome";
import BookCover from "@/features/expressCheckout/components/BookCover";
import { coverStyle } from "@/features/expressCheckout/constants/books";
import {
  useExpressCartStore,
  subtotalOf,
  shippingOf,
  totalOf,
} from "@/features/expressCheckout/store/expressCartStore";

export default function Cart() {
  const navigate = useNavigate();
  const items = useExpressCartStore((s) => s.items);
  const updateQty = useExpressCartStore((s) => s.updateQty);
  const removeItem = useExpressCartStore((s) => s.removeItem);

  const subtotal = subtotalOf(items);
  const shipping = shippingOf(items);
  const total = totalOf(items);

  return (
    <ShopChrome>
      <button type="button" className="back-link" onClick={() => navigate("/express")}>
        ← Keep browsing
      </button>
      <div className="section-head" style={{ marginBottom: 32 }}>
        <h2 className="section-title">Your cart</h2>
      </div>

      {items.length === 0 ? (
        <div className="cart-empty">
          <div className="cart-empty-icon">📚</div>
          <p>Nothing here yet. Go grab a good one.</p>
          <button type="button" className="btn btn-primary" onClick={() => navigate("/express")}>
            Browse the shelf
          </button>
        </div>
      ) : (
        <div className="cart-layout">
          <div className="cart-list">
            {items.map((item) => (
              <div key={item.id} className="cart-item">
                <div className="cart-cover" style={coverStyle(item)}>
                  <BookCover key={item.isbn} book={item} />
                  <div className="cart-cover-title">{item.title}</div>
                </div>
                <div className="cart-item-body">
                  <div className="cart-item-title">{item.title}</div>
                  <div className="cart-item-author">by {item.author}</div>
                  <div className="cart-item-foot">
                    <div className="cart-qty">
                      <button
                        type="button"
                        aria-label="Decrease quantity"
                        onClick={() => updateQty(item.id, -1)}
                      >
                        −
                      </button>
                      <span>{item.quantity}</span>
                      <button
                        type="button"
                        aria-label="Increase quantity"
                        onClick={() => updateQty(item.id, 1)}
                      >
                        +
                      </button>
                    </div>
                    <div className="cart-item-right">
                      <span className="cart-item-price">
                        ${(item.price * item.quantity).toFixed(2)}
                      </span>
                      <button
                        type="button"
                        className="cart-remove"
                        onClick={() => removeItem(item.id)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <aside className="summary">
            <h2>Order summary</h2>
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
            <div className="summary-btns">
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => navigate("/express/checkout")}
              >
                Complete purchase
              </button>
            </div>
            <p className="summary-note">Free shipping on orders over $50</p>
          </aside>
        </div>
      )}
    </ShopChrome>
  );
}
