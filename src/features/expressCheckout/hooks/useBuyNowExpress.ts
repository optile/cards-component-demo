import { type RefObject } from "react";
import { useNavigate } from "react-router-dom";
import { useExpressConfigStore } from "@/features/expressCheckout/store/expressConfigStore";
import {
  useExpressCartStore,
  CURRENCY,
  type CartItem,
} from "@/features/expressCheckout/store/expressCartStore";
import { useCheckoutSession } from "@/features/expressCheckout/hooks/useCheckoutSession";
import { useDebouncedValue } from "@/features/expressCheckout/hooks/useDebouncedValue";
import type { Book } from "@/features/expressCheckout/types/express";

const QTY_DEBOUNCE_MS = 400;

export interface BuyNowExpressResult {
  status: "loading" | "ready" | "error";
  available: boolean;
  error?: string;
}

/**
 * Book-detail "Buy it now": mounts the real Express Checkout Element for THIS book × the qty selector
 * on its own CheckoutWeb instance (via useCheckoutSession, express-only — no card, no keep-alive).
 *
 * On wallet success it snapshots just this book into `lastOrder` WITHOUT touching the cart, then
 * navigates to the shared Success page; on decline it navigates to Failure. Amount uses the same
 * shipping rule as checkout (via totalOf inside useCheckoutSession), so the wallet-sheet total matches
 * what checkout would charge. `book` may be undefined (book-not-found) — then items is empty and the
 * session never builds, so the hook can be called unconditionally.
 */
export function useBuyNowExpress(
  book: Book | undefined,
  qty: number,
  slotRef: RefObject<HTMLDivElement | null>,
): BuyNowExpressResult {
  const navigate = useNavigate();
  const allowRealRedirect = useExpressConfigStore((s) => s.allowRealRedirect);
  const placeOrderFor = useExpressCartStore((s) => s.placeOrderFor);

  const debouncedQty = useDebouncedValue(qty, QTY_DEBOUNCE_MS);
  const items: CartItem[] = book
    ? [{ ...book, quantity: Math.max(1, debouncedQty) }]
    : [];

  const { expressStatus, expressAvailable, expressError } = useCheckoutSession({
    items,
    currency: CURRENCY,
    active: true,
    expressSlotRef: slotRef,
    onSubmitSuccess: () => {
      // Snapshot THIS book as the order; the shopper's cart is left untouched.
      placeOrderFor(items);
      navigate("/express/success");
      // Demo default (allowRealRedirect === false) suppresses the real backend redirect.
      return allowRealRedirect;
    },
    onSubmitError: () => navigate("/express/failure"),
  });

  return {
    status: expressStatus,
    available: expressAvailable,
    error: expressError,
  };
}
