import { useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ShopChrome from "@/features/expressCheckout/components/ShopChrome";
import BookCover from "@/features/expressCheckout/components/BookCover";
import ExpressSlot from "@/features/expressCheckout/components/ExpressSlot";
import { useBuyNowExpress } from "@/features/expressCheckout/hooks/useBuyNowExpress";
import { getBook, coverStyle } from "@/features/expressCheckout/constants/books";
import { useExpressCartStore } from "@/features/expressCheckout/store/expressCartStore";

export default function Detail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const book = getBook(Number(id));
  const add = useExpressCartStore((s) => s.add);
  const [qty, setQty] = useState(1);

  // Real Express Checkout Element for this single book × qty (buy-it-now). Called unconditionally —
  // when `book` is undefined the hook builds no session. slotRef is the mount node inside the reveal.
  const expressSlotRef = useRef<HTMLDivElement | null>(null);
  const {
    status: expressStatus,
    available: expressAvailable,
    error: expressError,
  } = useBuyNowExpress(book, qty, expressSlotRef);

  if (!book) {
    return (
      <ShopChrome>
        <button type="button" className="back-link" onClick={() => navigate("/express")}>
          ← Back to the shelf
        </button>
        <p className="section-sub">Book not found.</p>
      </ShopChrome>
    );
  }

  const addToCart = () => {
    add(book, qty);
    navigate("/express/cart");
  };

  return (
    <ShopChrome>
      <button type="button" className="back-link" onClick={() => navigate("/express")}>
        ← Back to the shelf
      </button>
      <div className="detail">
        <div className="detail-cover" style={coverStyle(book)}>
          <BookCover key={book.isbn} book={book} />
          <div className="cover-title">{book.title}</div>
          <div className="cover-author">{book.author}</div>
        </div>
        <div>
          <div className="detail-eyebrow">{book.genre}</div>
          <h1 className="detail-title">{book.title}</h1>
          <p className="detail-author">by {book.author}</p>
          <div className="detail-info-row">
            <span className="detail-price">${book.price}</span>
            <span className="detail-rating">
              ★ {book.rating} · {book.reviews.toLocaleString()} reviews
            </span>
          </div>
          <p className="detail-desc">{book.description}</p>
          <div className="qty-row">
            <span className="qty-label">Quantity</span>
            <div className="qty-controls">
              <button
                type="button"
                className="qty-btn"
                aria-label="Decrease quantity"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
              >
                −
              </button>
              <span className="qty-val">{qty}</span>
              <button
                type="button"
                className="qty-btn"
                aria-label="Increase quantity"
                onClick={() => setQty((q) => q + 1)}
              >
                +
              </button>
            </div>
          </div>
          <div className="detail-actions">
            <button type="button" className="btn btn-primary" onClick={addToCart}>
              Add to cart
            </button>
          </div>
          {/* Real Express Checkout Element — collapsed until a wallet is available (same slide-down
              reveal as the checkout page). Hidden entirely when no wallet: no empty box, no dangling
              divider. The mount node stays laid out (clipped) while collapsed so Stripe can detect
              wallets. */}
          <div className={`express-reveal${expressAvailable ? " is-visible" : ""}`}>
            <div className="express-reveal-inner">
              <div className="pay-or">or pay instantly</div>
              <ExpressSlot
                slotRef={expressSlotRef}
                status={expressStatus}
                error={expressError}
              />
              {/* Kept inside the reveal so the explainer only shows once a wallet is available/resolved
                  — never dangling below an absent express element. */}
              <div className="express-note">
                <span>
                  <strong>Skip the forms.</strong> Express checkout lets you pay instantly with your
                  preferred wallet, no card details to type.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ShopChrome>
  );
}
