import React from "react";
import { formatCurrency } from "../../utils/reviewUtils";
import type { MerchantCart } from "../../store/configurationStore";
import type { ReviewSectionProps } from "../../types/hostedPayment";

interface ReviewCartSectionProps extends ReviewSectionProps {
  merchantCart: MerchantCart;
}

const ReviewCartSection: React.FC<ReviewCartSectionProps> = ({
  merchantCart,
  className = "",
}) => {
  return (
    <div className={`bg-gray-50 p-4 rounded-lg ${className}`}>
      <h3 className="font-semibold text-gray-800 mb-3">Cart Details</h3>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">Item:</span>
          <span className="font-medium">{merchantCart.itemName}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Amount:</span>
          <span className="font-medium">
            {formatCurrency(merchantCart.amount, merchantCart.currency)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Quantity:</span>
          <span className="font-medium">{merchantCart.quantity}</span>
        </div>
      </div>
    </div>
  );
};

export default ReviewCartSection;
