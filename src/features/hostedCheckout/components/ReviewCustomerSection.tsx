import React from "react";
import {
  formatAddress,
  formatFullName,
} from "@/features/hostedCheckout/utils/reviewUtils";
import type { BillingAddress, ShippingAddress } from "@/types/merchant";
import type { ReviewSectionProps } from "@/features/hostedCheckout/types/hostedPayment";

interface ReviewCustomerSectionProps extends ReviewSectionProps {
  billingAddress: BillingAddress;
  shippingAddress: ShippingAddress;
  sameAddress: boolean;
}

const ReviewCustomerSection: React.FC<ReviewCustomerSectionProps> = ({
  billingAddress,
  shippingAddress,
  sameAddress,
  className = "",
}) => {
  return (
    <div className={`bg-gray-50 p-4 rounded-lg ${className}`}>
      <h3 className="font-semibold text-gray-800 mb-3">Customer Information</h3>
      <div className="text-sm space-y-4">
        <div>
          <h4 className="font-medium text-gray-700 mb-2">Billing Address</h4>
          <p>
            <span className="text-gray-600">Name:</span>{" "}
            <span className="font-medium">
              {formatFullName(
                billingAddress.firstName,
                billingAddress.lastName
              )}
            </span>
          </p>
          <p>
            <span className="text-gray-600">Email:</span>{" "}
            <span className="font-medium">{billingAddress.email}</span>
          </p>
          {billingAddress.phone && (
            <p>
              <span className="text-gray-600">Phone:</span>{" "}
              <span className="font-medium">{billingAddress.phone}</span>
            </p>
          )}
          <p>
            <span className="text-gray-600">Address:</span>{" "}
            <span className="font-medium">{formatAddress(billingAddress)}</span>
          </p>
        </div>

        {!sameAddress && (
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Shipping Address</h4>
            <p>
              <span className="text-gray-600">Name:</span>{" "}
              <span className="font-medium">
                {formatFullName(
                  shippingAddress.firstName,
                  shippingAddress.lastName
                )}
              </span>
            </p>
            <p>
              <span className="text-gray-600">Address:</span>{" "}
              <span className="font-medium">
                {formatAddress(shippingAddress)}
              </span>
            </p>
          </div>
        )}

        {sameAddress && (
          <p className="text-gray-500 italic">
            Shipping address same as billing
          </p>
        )}
      </div>
    </div>
  );
};

export default ReviewCustomerSection;
