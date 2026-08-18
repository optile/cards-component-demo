import { Link } from "react-router-dom";
import type { Book } from "@/features/expressCheckout/types/express";

export default function BookCard({ env, book }: { env: string; book: Book }) {
  return (
    <Link
      to={`/express/${env}/book/${book.id}`}
      className="block rounded-xl p-4 no-underline"
      style={{ background: "var(--card)", border: "1px solid var(--line)", color: "var(--ink)" }}
    >
      <div className="h-40 rounded-lg mb-3" style={{ background: `linear-gradient(135deg, ${book.cover.spine}, ${book.cover.front})` }} />
      <div className="text-base" style={{ fontFamily: "var(--font-serif)" }}>{book.title}</div>
      <div className="text-[13px]" style={{ color: "var(--ink-soft)" }}>{book.author}</div>
      <div className="mt-1 text-sm">${book.price.toFixed(2)}</div>
    </Link>
  );
}
