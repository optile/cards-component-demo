import { Link, useParams } from "react-router-dom";
import ShopLayout from "@/features/expressCheckout/components/ShopLayout";
import ExpressSlot from "@/features/expressCheckout/components/ExpressSlot";
import OutcomeBanner from "@/features/expressCheckout/components/OutcomeBanner";
import { getBook } from "@/features/expressCheckout/constants/books";
import { useExpressShopStore } from "@/features/expressCheckout/store/expressShopStore";

export default function ExpressCheckoutPage() {
  const { env = "checkout.integration" } = useParams();
  const { currentBookId, quantity, currency } = useExpressShopStore();
  const book = getBook(currentBookId ?? undefined);
  const total = book ? book.price * quantity : 0;

  return (
    <ShopLayout env={env}>
      <Link to={`/express/${env}/shelf`} className="text-sm" style={{ color: "var(--ink-soft)" }}>← Keep browsing</Link>
      <h1 className="text-3xl my-4" style={{ fontFamily: "var(--font-serif)" }}>Checkout</h1>
      <OutcomeBanner />
      {!book ? (
        <p style={{ color: "var(--ink-soft)" }}>Your cart is empty. <Link to={`/express/${env}/shelf`}>Browse the shelf</Link>.</p>
      ) : (
        <div className="grid md:grid-cols-2 gap-8">
          <div className="rounded-xl p-4" style={{ background: "var(--card)", border: "1px solid var(--line)" }}>
            <h2 className="text-lg mb-3" style={{ fontFamily: "var(--font-serif)" }}>Order summary</h2>
            <div className="flex justify-between text-sm mb-1">
              <span>{book.title}{quantity > 1 ? ` × ${quantity}` : ""}</span>
              <span>${total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-semibold border-t pt-2 mt-2" style={{ borderColor: "var(--line)" }}>
              <span>Total</span>
              <span>${total.toFixed(2)} {currency}</span>
            </div>
          </div>
          <div>
            <div className="rounded-xl p-4 mb-4" style={{ background: "var(--card)", border: "1px solid var(--line)" }}>
              <div className="text-sm mb-2" style={{ color: "var(--spark)", fontWeight: 600 }}>⚡ Express checkout</div>
              <ExpressSlot />
            </div>
            <a href="/cards-component-demo/embedded" className="text-sm underline" style={{ color: "var(--ink-soft)" }}>
              Prefer to pay by card? Use the Embedded flow →
            </a>
          </div>
        </div>
      )}
    </ShopLayout>
  );
}
