import React from "react";
import type { StepComponentProps } from "@/components/ui/MultiStepper";
import Button from "@/components/ui/Button";
import { useHostedConfigurationStore } from "@/features/hostedCheckout/store/hostedConfigurationStore";
import { useHostedPaymentFlow } from "@/features/hostedCheckout/hooks/useHostedPaymentFlow";
import ReviewEnvironmentSection from "./ReviewEnvironmentSection";
import ReviewCartSection from "./ReviewCartSection";
import ReviewCustomerSection from "./ReviewCustomerSection";
import ReadyMessage from "./ReadyMessage";
import ErrorAlert from "./ErrorAlert";

const ReviewConfirmStep: React.FC<StepComponentProps> = ({
  goToPrevious,
  isFirstStep,
  isLastStep,
}) => {
  const { env, merchantCart, billingAddress, shippingAddress, sameAddress } =
    useHostedConfigurationStore();

  const { isLoading, error, initiateHostedPayment, clearError } =
    useHostedPaymentFlow();

  const handleSubmit = async () => {
    await initiateHostedPayment(
      merchantCart,
      billingAddress,
      shippingAddress,
      sameAddress,
      env
    );
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-sm border">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">
        Review & Confirm
      </h2>
      <p className="text-gray-600 mb-6">
        Review your settings and confirm the configuration.
      </p>

      <div className="space-y-6 mb-8">
        <ReviewEnvironmentSection env={env} />
        <ReviewCartSection merchantCart={merchantCart} />
        <ReviewCustomerSection
          billingAddress={billingAddress}
          shippingAddress={shippingAddress}
          sameAddress={sameAddress}
        />
      </div>

      <ReadyMessage className="mb-8" />

      <ErrorAlert error={error} onDismiss={clearError} />

      <div className="flex justify-between">
        <Button
          onClick={goToPrevious}
          disabled={isFirstStep || isLoading}
          variant="secondary"
          className="text-gray-600 border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={isLoading}
          variant="primary"
          className="px-6 py-2 bg-green-500 hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ backgroundColor: "#10B981" }}
        >
          {isLoading ? "Processing..." : isLastStep ? "Complete" : "Next"}
        </Button>
      </div>
    </div>
  );
};

export default ReviewConfirmStep;
