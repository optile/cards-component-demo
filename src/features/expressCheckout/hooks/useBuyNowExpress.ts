import { type RefObject } from "react";
import { useNavigate } from "react-router-dom";
import { useExpressConfigStore } from "@/features/expressCheckout/store/expressConfigStore";
import {
  useExpressCartStore,
  CURRENCY,
  type CartItem,
} from "@/features/expressCheckout/store/expressCartStore";
import { useExpressCheckoutStore } from "@/features/expressCheckout/store/expressCheckoutStore";
import { useCheckoutSession } from "@/features/expressCheckout/hooks/useCheckoutSession";
import { BOOKS } from "@/features/expressCheckout/constants/books";
import { toExpressOrder, type Book } from "@/features/expressCheckout/types/express";
import { receiptFromExpressOrder } from "@/features/expressCheckout/utils/receiptFromExpressOrder";
import {
  chargeRefsForOutcome,
  hasFollowableRedirect,
  stashExpressSuccess,
} from "@/features/expressCheckout/utils/chargeRefs";

export interface BuyNowExpressResult {
  status: "loading" | "ready" | "unavailable" | "error";
  available: boolean;
  error?: string;
}

/**
 * Book-detail "Buy it now": mounts the real Express Checkout Element for THIS book × the qty selector
 * on its own CheckoutWeb instance (via useCheckoutSession, express-only - no card, no keep-alive).
 *
 * On wallet success it snapshots just this book into `lastOrder` WITHOUT touching the cart, then
 * navigates to the shared Success page; on decline it navigates to Failure. Amount uses the same
 * shipping rule as checkout (via totalOf inside useCheckoutSession), so the wallet-sheet total matches
 * what checkout would charge. `book` may be undefined (book-not-found) - then items is empty and the
 * session never builds, so the hook can be called unconditionally.
 */
export function useBuyNowExpress(
  book: Book | undefined,
  qty: number,
  slotRef: RefObject<HTMLDivElement | null>,
): BuyNowExpressResult {
  const navigate = useNavigate();
  const allowRealRedirect = useExpressConfigStore((s) => s.allowRealRedirect);
  const shippingAddressRequired = useExpressConfigStore((s) => s.shippingAddressRequired);
  const placeOrderFor = useExpressCartStore((s) => s.placeOrderFor);
  const setChargeRefs = useExpressCheckoutStore((s) => s.setChargeRefs);

  // Every quantity tick reaches express.update() at once; the session key excludes items, so nothing is
  // rebuilt, and the SDK holds an update that lands while the wallet sheet is open.
  const items: CartItem[] = book ? [{ ...book, quantity: Math.max(1, qty) }] : [];

  const { expressStatus, expressAvailable, expressError } = useCheckoutSession({
    items,
    currency: CURRENCY,
    active: true,
    expressSlotRef: slotRef,
    onSubmitSuccess: (data, hostIds) => {
      const payload = data as Record<string, unknown> | null;
      const eo = payload?.expressOrder;
      // Buy-now renders the receipt from the placed order's `expressOverrides` (below), not from the
      // shared `finalExpressOrder` store (only the checkout-page CheckoutView subscriber reads that),
      // so we intentionally do not write `finalExpressOrder` here.
      const receipt = receiptFromExpressOrder(
        toExpressOrder(eo),
        items,
        BOOKS,
        shippingAddressRequired,
      );
      const chargeRefs = chargeRefsForOutcome(data, hostIds);
      setChargeRefs(chargeRefs);
      const order = placeOrderFor(receipt.items, receipt.overrides);
      // Bridge the receipt across the hard returnUrl reload; only stash when the SDK will navigate,
      // or the unclaimed stash would decorate a later receipt.
      if (allowRealRedirect && hasFollowableRedirect(data)) stashExpressSuccess({ order, chargeRefs });
      navigate("/express/success");
      return allowRealRedirect;
    },
    onSubmitError: (data, hostIds) => {
      setChargeRefs(chargeRefsForOutcome(data, hostIds));
      navigate("/express/failure");
      return false;
    },
  });

  return {
    status: expressStatus,
    available: expressAvailable,
    error: expressError,
  };
}
