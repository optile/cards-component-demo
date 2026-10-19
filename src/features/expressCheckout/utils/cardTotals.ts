import type { CartProduct } from "@/types/merchant";
import type {
  CartItem,
  ExpressOrderOverrides,
} from "@/features/expressCheckout/store/expressCartStore";
import { shippingOf, subtotalOf } from "@/features/expressCheckout/store/expressCartStore";
import {
  listCountryOf,
  type BuyerCountry,
} from "@/features/expressCheckout/store/expressBuyerStore";
import { fromCents, toCents } from "@/features/expressCheckout/utils/money";

/** Demo rates by LIST billing country. Not a tax engine. */
const EST_TAX_RATE = {
  US: 0.08,
  CA: 0.05,
  GB: 0.2,
  AU: 0.1,
  DE: 0.19,
  IN: 0.18,
  PH: 0.12,
} satisfies Record<Exclude<BuyerCountry, "OTHER">, number>;

function taxRateFor(country: string): number {
  const listCountry = listCountryOf(country);
  return listCountry in EST_TAX_RATE
    ? EST_TAX_RATE[listCountry as keyof typeof EST_TAX_RATE]
    : EST_TAX_RATE.US;
}

function taxCentsOf(items: CartItem[], country: string): number {
  return Math.round(toCents(subtotalOf(items)) * taxRateFor(country));
}

/** Est. tax on goods subtotal only (shipping untaxed in this demo). */
export function taxOf(items: CartItem[], country: string): number {
  return fromCents(taxCentsOf(items, country));
}

export function cardTotalOf(items: CartItem[], country: string): number {
  const cents =
    toCents(subtotalOf(items)) + toCents(shippingOf(items)) + taxCentsOf(items, country);
  return fromCents(cents);
}

/** Receipt overrides for a card (or demo-complete) order, matching the card LIST total. */
export function cardOrderOverrides(items: CartItem[], country: string): ExpressOrderOverrides {
  return {
    total: cardTotalOf(items, country),
    shippingAmount: shippingOf(items),
    taxAmount: taxOf(items, country),
  };
}

/**
 * LIST products for the card path: one line per book carrying its share of the est. tax as
 * `taxAmount`, plus the shipping line. Sums to `cardTotalOf` via `getCartTotal` / `getLineTotal`.
 * Amounts are computed in the browser for the demo; a production shop prices and taxes the cart on
 * its server from `{id, quantity}`.
 */
export function buildCardListProducts(items: CartItem[], country: string): CartProduct[] {
  const rate = taxRateFor(country);
  let remainingTaxCents = taxCentsOf(items, country);
  const products: CartProduct[] = items.map((i, index) => {
    const lineTaxCents =
      index === items.length - 1
        ? remainingTaxCents
        : Math.round(toCents(i.price * i.quantity) * rate);
    remainingTaxCents -= lineTaxCents;
    return {
      name: i.title,
      price: i.price,
      quantity: i.quantity,
      ...(lineTaxCents > 0 && { taxAmount: fromCents(lineTaxCents) }),
    };
  });
  const shippingFee = shippingOf(items);
  if (shippingFee > 0) {
    products.push({ name: "Shipping", price: shippingFee, quantity: 1, type: "SHIPPING" });
  }
  return products;
}
