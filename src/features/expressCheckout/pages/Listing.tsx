import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import ShopChrome from "@/features/expressCheckout/components/ShopChrome";
import BookCover from "@/features/expressCheckout/components/BookCover";
import { BOOKS, coverStyle } from "@/features/expressCheckout/constants/books";
import {
  useExpressCartStore,
  CURRENCY,
} from "@/features/expressCheckout/store/expressCartStore";
import { useExpressConfigStore } from "@/features/expressCheckout/store/expressConfigStore";
import { prefetchExpressSession } from "@/features/expressCheckout/units/expressPrefetch";
import type { Book } from "@/features/expressCheckout/types/express";

// Design's hero picks: books[3], books[1], books[2] (0-indexed).
const HERO_PICKS = [BOOKS[3], BOOKS[1], BOOKS[2]];

// Require the pointer to rest on a card this long before warming its session, so sweeping the mouse
// across the shelf on the way somewhere else doesn't fire a LIST session for every book it grazes.
const HOVER_DWELL_MS = 120;

export default function Listing() {
  const navigate = useNavigate();
  const add = useExpressCartStore((s) => s.add);

  // One shared dwell timer: only the card the pointer currently rests on is pending. Cleared on leave
  // and on unmount so a queued prefetch never fires after the shopper moves on or leaves the page.
  const dwellTimer = useRef<number | undefined>(undefined);
  const cancelDwell = () => {
    window.clearTimeout(dwellTimer.current);
    dwellTimer.current = undefined;
  };
  useEffect(() => cancelDwell, []);

  // Warm a book's buy-now express session in the background so the detail page can mount the ECE
  // without waiting on the LIST + init round-trips. Keyed on book × qty 1 (the detail page's starting
  // quantity); idempotent.
  const prewarmBook = (book: Book) =>
    prefetchExpressSession(
      useExpressConfigStore.getState(),
      [{ ...book, quantity: 1 }],
      CURRENCY,
    );

  // Hover = weak intent: warm only after the pointer dwells. Press = strong intent: warm immediately.
  const onCardEnter = (book: Book) => {
    cancelDwell();
    dwellTimer.current = window.setTimeout(() => prewarmBook(book), HOVER_DWELL_MS);
  };
  const onCardPress = (book: Book) => {
    cancelDwell();
    prewarmBook(book);
  };

  return (
    <ShopChrome>
      <section className="hero">
        <div style={{ position: "relative", zIndex: 2 }}>
          <div className="hero-eyebrow">Warning: highly bingeable</div>
          <h1 className="hero-title">
            Books you'll <em>actually</em> finish.
          </h1>
          <p className="hero-sub">
            Grab a good one, check out in a tap with your wallet, and get back to reading. No fuss.
          </p>
        </div>
        <div className="hero-stack">
          {HERO_PICKS.map((b) => (
            <div key={b.id} className="hero-book" style={coverStyle(b)}>
              <BookCover book={b} />
            </div>
          ))}
        </div>
      </section>

      <div className="section-head">
        <div>
          <h2 className="section-title">On the shelf</h2>
          <p className="section-sub">The ones we keep pressing into people's hands.</p>
        </div>
      </div>

      <div className="grid">
        {BOOKS.map((b) => (
          <div
            key={b.id}
            className="card"
            onClick={() => navigate(`/express/book/${b.id}`)}
            onPointerEnter={() => onCardEnter(b)}
            onPointerLeave={cancelDwell}
            onPointerDown={() => onCardPress(b)}
          >
            <div className="cover" style={coverStyle(b)}>
              <BookCover book={b} />
              <div className="cover-title">{b.title}</div>
              <div className="cover-author">{b.author}</div>
              <div className="cover-actions" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  className="cover-btn cover-btn-cart"
                  onClick={() => add(b, 1)}
                >
                  Add to cart
                </button>
              </div>
            </div>
            <div className="card-meta">
              <div>
                <div className="card-title">{b.title}</div>
                <div className="card-author">{b.author}</div>
                <div className="card-rating">
                  ★ {b.rating} · {b.reviews.toLocaleString()} reviews
                </div>
              </div>
              <div className="card-price">${b.price}</div>
            </div>
          </div>
        ))}
      </div>
    </ShopChrome>
  );
}
