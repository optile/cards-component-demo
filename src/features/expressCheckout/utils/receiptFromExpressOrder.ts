import type { CartItem, ExpressOrderOverrides } from "@/features/expressCheckout/store/expressCartStore";
import { subtotalOf, totalOf } from "@/features/expressCheckout/store/expressCartStore";
import type {
  Book,
  ExpressOrderProductLine,
  ExpressOrderWithProducts,
} from "@/features/expressCheckout/types/express";
import { toExpressOrderOverrides } from "@/features/expressCheckout/utils/toExpressOrderOverrides";

const BOOK_CODE = /^book-(\d+)$/;
const SHIPPING_FEE_CODE = "shipping-fee";

/**
 * Maps the charged cart back to receipt items, all or nothing. Skips the shipping-fee line (the receipt
 * derives shipping itself) and returns `undefined` when any other line does not name a catalog book, so the
 * caller falls back to the live cart instead of showing a partial receipt.
 */
export function toReceiptItems(
  products: readonly ExpressOrderProductLine[] | undefined,
  catalog: readonly Book[],
): CartItem[] | undefined {
  if (!products || products.length === 0) return undefined;
  const items: CartItem[] = [];
  for (const line of products) {
    if (line.code === SHIPPING_FEE_CODE) continue;
    const match = line.code ? BOOK_CODE.exec(line.code) : null;
    const book = match ? catalog.find((candidate) => candidate.id === Number(match[1])) : undefined;
    if (!book) return undefined;
    items.push({ ...book, quantity: line.quantity ?? 1 });
  }
  return items.length > 0 ? items : undefined;
}

const toCents = (major: number): number => Math.round(major * 100);

/**
 * True when the charged base (total minus the wallet rate) differs from the live cart's express base, in
 * cents. With wallet shipping rates on, that base is the goods subtotal (the cart's flat fee is not charged).
 */
function chargedDiffersFromCart(
  eo: ExpressOrderWithProducts,
  items: CartItem[],
  shippingAddressRequired: boolean,
): boolean {
  const chargedBase = toCents(Number(eo.amount)) - toCents(Number(eo.shippingRate?.amount ?? 0));
  const liveBase = shippingAddressRequired ? subtotalOf(items) : totalOf(items);
  return chargedBase !== toCents(liveBase);
}

/**
 * The receipt for a successful express payment: the charged cart when it maps to the catalog, otherwise the
 * live cart, flagged when its total differs from what was charged.
 */
export function receiptFromExpressOrder(
  eo: ExpressOrderWithProducts | null | undefined,
  liveItems: CartItem[],
  catalog: readonly Book[],
  shippingAddressRequired: boolean,
): { items: CartItem[]; overrides?: ExpressOrderOverrides } {
  if (!eo) return { items: liveItems };
  const overrides = toExpressOrderOverrides(eo);
  const charged = toReceiptItems(eo.products, catalog);
  if (charged) return { items: charged, overrides };
  return {
    items: liveItems,
    overrides: chargedDiffersFromCart(eo, liveItems, shippingAddressRequired)
      ? { ...overrides, cartChanged: true }
      : overrides,
  };
}
