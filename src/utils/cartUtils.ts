import type { CartProduct } from "@/types/merchant";

// Round to minor units so summed lines match payment.amount exactly (the HPP cart summary is
// hidden on even a one-cent mismatch)
const roundAmount = (value: number) => Math.round(value * 100) / 100;

/** Line total sent to the LIST: net price of all units + tax + discount. */
export const getLineTotal = (product: CartProduct): number =>
  roundAmount(
    product.price * product.quantity +
      (product.taxAmount ?? 0) +
      (product.discountAmount ?? 0)
  );

/** Cart total; equals the sum of the line totals, so it reconciles with the LIST products. */
export const getCartTotal = (products: CartProduct[]): number =>
  roundAmount(products.reduce((total, product) => total + getLineTotal(product), 0));
