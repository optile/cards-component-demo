import { getCurrencySymbol } from "@/features/embeddedCheckout/utils/checkoutUtils";
import type { CartProduct } from "@/types/merchant";
import { getCartTotal, getLineTotal } from "@/utils/cartUtils";

interface ShoppingCartSectionProps {
  products: CartProduct[];
  currency: string;
}

const ShoppingCartSection = ({
  products,
  currency,
}: ShoppingCartSectionProps) => {
  const calculateTotal = () => {
    return getCartTotal(products);
  };

  return (
    <div className="md:col-span-1">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4 border-b pb-2">
          Shopping Cart
        </h2>
        <div className="space-y-2 mb-4">
          {products.map((product, index) => (
            <div key={index} className="flex justify-between mb-2">
              <span>
                {product.name} × {product.quantity}
              </span>
              <span>
                {getCurrencySymbol(currency)}
                {getLineTotal(product).toFixed(2)}
              </span>
            </div>
          ))}
        </div>
        <div className="flex justify-between font-bold text-lg border-t pt-2">
          <span>Total</span>
          <span>
            {getCurrencySymbol(currency)}
            {calculateTotal().toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ShoppingCartSection;
