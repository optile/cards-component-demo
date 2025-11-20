import React from "react";
import { formatCurrency } from "@/features/hostedCheckout/utils/reviewUtils";
import type { MerchantCart } from "@/types/merchant";
import type { ReviewSectionProps } from "@/features/hostedCheckout/types/hostedPayment";

interface ReviewCartSectionProps extends ReviewSectionProps {
  merchantCart: MerchantCart;
}

const ReviewCartSection: React.FC<ReviewCartSectionProps> = ({
  merchantCart,
  className = "",
}) => {
  const calculateTotal = () => {
    return merchantCart.products.reduce(
      (total, product) => total + product.price * product.quantity,
      0
    );
  };

  return (
    <div className={`bg-gray-50 p-4 rounded-lg ${className}`}>
      <h3 className="font-semibold text-gray-800 mb-3">Cart Details</h3>
      <div className="space-y-3 text-sm mb-3">
        {merchantCart.products.map((product, index) => (
          <div key={index} className="pb-2 border-b border-gray-200">
            <div className="flex justify-between mb-1">
              <span className="text-gray-600">Product:</span>
              <span className="font-medium">{product.name}</span>
            </div>
            <div className="flex justify-between mb-1">
              <span className="text-gray-600">Price:</span>
              <span className="font-medium">
                {formatCurrency(product.price, merchantCart.currency)}
              </span>
            </div>
            <div className="flex justify-between mb-1">
              <span className="text-gray-600">Quantity:</span>
              <span className="font-medium">{product.quantity}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Line Total:</span>
              <span className="font-medium">
                {formatCurrency(
                  product.price * product.quantity,
                  merchantCart.currency
                )}
              </span>
            </div>
          </div>
        ))}
      </div>
      <div className="flex justify-between text-base font-semibold pt-2 border-t-2 border-gray-300">
        <span className="text-gray-800">Total Amount:</span>
        <span className="text-gray-800">
          {formatCurrency(calculateTotal(), merchantCart.currency)}
        </span>
      </div>
    </div>
  );
};

export default ReviewCartSection;
