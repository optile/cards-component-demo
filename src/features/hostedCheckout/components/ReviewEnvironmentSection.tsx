import React from "react";
import type { ReviewSectionProps } from "@/features/hostedCheckout/types/hostedPayment";
import { createDetailedEnvironmentOptions } from "@/utils";

interface ReviewEnvironmentSectionProps extends ReviewSectionProps {
  env: string;
}

const ReviewEnvironmentSection: React.FC<ReviewEnvironmentSectionProps> = ({
  env,
  className = "",
}) => {
  const environment = createDetailedEnvironmentOptions().find(
    (option) => option.value === env
  );

  return (
    <div className={`bg-gray-50 p-4 rounded-lg ${className}`}>
      <h3 className="font-semibold text-gray-800 mb-3">Environment</h3>
      <div className="text-sm">
        <span className="font-medium capitalize">{env}</span>
        {environment && (
          <p className="text-gray-500">{environment.description}</p>
        )}
      </div>
    </div>
  );
};

export default ReviewEnvironmentSection;
