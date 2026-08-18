import { useParams } from "react-router-dom";
import ShopLayout from "@/features/expressCheckout/components/ShopLayout";
import BookCard from "@/features/expressCheckout/components/BookCard";
import { BOOKS } from "@/features/expressCheckout/constants/books";

export default function Shelf() {
  const { env = "checkout.integration" } = useParams();
  return (
    <ShopLayout env={env}>
      <h1 className="text-3xl mb-2" style={{ fontFamily: "var(--font-serif)" }}>Books you'll actually finish.</h1>
      <p className="mb-6 text-sm" style={{ color: "var(--ink-soft)" }}>
        Grab a good one, check out in a tap with your wallet, and get back to reading.
      </p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {BOOKS.map((b) => (
          <BookCard key={b.id} env={env} book={b} />
        ))}
      </div>
    </ShopLayout>
  );
}
