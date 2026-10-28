import React from "react";

interface ReviewPaymentMethodOrderSectionProps {
  paymentMethodOrder: string;
}

const ReviewPaymentMethodOrderSection: React.FC<
  ReviewPaymentMethodOrderSectionProps
> = ({ paymentMethodOrder }) => {
  return (
    <div className="bg-gray-50 p-4 rounded border border-gray-200">
      <h3 className="font-semibold text-gray-800 mb-2">
        Payment Method Order (Cards)
      </h3>
      {paymentMethodOrder ? (
        <p className="text-gray-600">{paymentMethodOrder}</p>
      ) : (
        <p className="text-gray-500 italic">Default Stripe ordering</p>
      )}
    </div>
  );
};

export default ReviewPaymentMethodOrderSection;
