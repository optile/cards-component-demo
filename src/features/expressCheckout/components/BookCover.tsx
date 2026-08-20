import { useState } from "react";
import { coverImageUrl } from "@/features/expressCheckout/constants/books";
import type { Book } from "@/features/expressCheckout/types/express";

/**
 * Real book cover (bundled in `public/covers/<isbn>.jpg`, sourced from Open Library) layered over the
 * parent's gradient + title/author overlay. Drop it in as the first child of any cover container
 * (`.cover`, `.detail-cover`, `.cart-cover`, `.hero-book`). On load error — missing file, offline —
 * it renders nothing, letting the gradient fallback show through. Purely decorative (the visible title
 * text is the accessible label), so the image is `aria-hidden`.
 *
 * State is per-instance; callers under a stable list key (or a single detail view) never leak a
 * failed flag across books. For surfaces where the same slot can swap books in place, pass
 * `key={book.isbn}` at the call site to remount cleanly.
 */
export default function BookCover({
  book,
}: Readonly<{ book: Pick<Book, "isbn" | "title"> }>) {
  const [failed, setFailed] = useState(false);
  if (!book.isbn || failed) return null;
  return (
    <img
      className="book-cover-img"
      src={coverImageUrl(book.isbn)}
      alt=""
      aria-hidden="true"
      loading="lazy"
      draggable={false}
      onError={() => setFailed(true)}
    />
  );
}
