import type { Book } from "@/features/expressCheckout/types/express";

// Cover colors are used for a CSS-drawn spine/front (no image assets).
export const BOOKS: Book[] = [
  { id: "tidal", title: "Tidal", author: "M. Okonkwo", price: 18, rating: 4.7, reviews: 1284,
    blurb: "A lighthouse keeper's logbook becomes a map of everyone she never wrote back.",
    cover: { spine: "#3B4A6B", front: "#C56B4A" } },
  { id: "orchard", title: "The Night Orchard", author: "L. Fenn", price: 15, rating: 4.5, reviews: 902,
    blurb: "Two sisters inherit a farm that only bears fruit on the nights they don't speak.",
    cover: { spine: "#6E7F5B", front: "#9770FF" } },
  { id: "signal", title: "Signal Fire", author: "R. Devi", price: 22, rating: 4.8, reviews: 2011,
    blurb: "A radio astronomer chases a pattern that turns out to be a goodbye.",
    cover: { spine: "#8E3B5C", front: "#B8894A" } },
  { id: "margin", title: "Wide Margins", author: "T. Alvarez", price: 12, rating: 4.3, reviews: 511,
    blurb: "Marginalia from a used bookshop reassemble a stranger's unfinished year.",
    cover: { spine: "#2B6E6A", front: "#3B4A6B" } },
];

export function getBook(id: string | undefined): Book | undefined {
  return BOOKS.find((b) => b.id === id);
}
