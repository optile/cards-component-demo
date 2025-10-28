import React from "react";
import type { ReviewSectionProps } from "@/features/hostedCheckout/types/hostedPayment";

interface ReviewEnvironmentSectionProps extends ReviewSectionProps {
  env: string;
}

const ReviewEnvironmentSection: React.FC<ReviewEnvironmentSectionProps> = ({
  env,
  className = "",
}) => {
  return (
    <div className={`bg-gray-50 p-4 rounded-lg ${className}`}>
      <h3 className="font-semibold text-gray-800 mb-3">Environment</h3>
      <div className="text-sm">
        <span className="font-medium capitalize">{env}</span>
        <p className="text-gray-500">
          {env === "sandbox"
            ? "Development environment for testing"
            : "Production environment"}
        </p>
      </div>
    </div>
  );
};

export default ReviewEnvironmentSection;
