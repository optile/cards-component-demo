import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import ShopLayout from "@/features/expressCheckout/components/ShopLayout";
import ExpressSlot from "@/features/expressCheckout/components/ExpressSlot";
import OutcomeBanner from "@/features/expressCheckout/components/OutcomeBanner";
import { getBook } from "@/features/expressCheckout/constants/books";
import { useExpressShopStore } from "@/features/expressCheckout/store/expressShopStore";

export default function ProductDetail() {
  const { env = "checkout.integration", id } = useParams();
  const book = getBook(id);
  const { quantity, setBook, setQuantity } = useExpressShopStore();

  useEffect(() => {
    if (id) setBook(id);
  }, [id, setBook]);

  if (!book) {
    return (
      <ShopLayout env={env}>
        <p>Book not found. <Link to={`/express/${env}/shelf`}>Back to the shelf</Link></p>
      </ShopLayout>
    );
  }

  return (
    <ShopLayout env={env}>
      <Link to={`/express/${env}/shelf`} className="text-sm" style={{ color: "var(--ink-soft)" }}>← Back to the shelf</Link>
      <OutcomeBanner />
      <div className="grid md:grid-cols-2 gap-8 mt-4">
        <div className="h-72 rounded-xl" style={{ background: `linear-gradient(135deg, ${book.cover.spine}, ${book.cover.front})` }} />
        <div>
          <h1 className="text-3xl" style={{ fontFamily: "var(--font-serif)" }}>{book.title}</h1>
          <div className="text-sm mb-2" style={{ color: "var(--ink-soft)" }}>{book.author}</div>
          <div className="text-sm mb-4" style={{ color: "var(--ink)" }}>{book.blurb}</div>
          <div className="text-xl mb-4">${(book.price * quantity).toFixed(2)}</div>

          <div className="flex items-center gap-3 mb-6">
            <span className="text-sm" style={{ color: "var(--ink-soft)" }}>Quantity</span>
            <button onClick={() => setQuantity(quantity - 1)} className="w-8 h-8 rounded border" style={{ borderColor: "var(--line)" }}>−</button>
            <span>{quantity}</span>
            <button onClick={() => setQuantity(quantity + 1)} className="w-8 h-8 rounded border" style={{ borderColor: "var(--line)" }}>+</button>
          </div>

          <div className="rounded-xl p-4 mb-4" style={{ background: "var(--card)", border: "1px solid var(--line)" }}>
            <div className="text-sm mb-2" style={{ color: "var(--spark)", fontWeight: 600 }}>⚡ Express checkout</div>
            <ExpressSlot />
          </div>

          <Link
            to={`/express/${env}/checkout`}
            className="inline-block px-5 py-2 rounded-lg text-white no-underline"
            style={{ background: "var(--accent)" }}
          >
            Go to checkout
          </Link>
        </div>
      </div>
    </ShopLayout>
  );
}
