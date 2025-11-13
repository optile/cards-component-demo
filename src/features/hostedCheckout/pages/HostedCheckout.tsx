import { useMemo } from "react";
import { MultiStepper } from "@/components/ui/MultiStepper";
import ChooseEnvironmentStep from "@/features/hostedCheckout/components/ChooseEnvironmentStep";
import ConfigureCartStep from "@/features/hostedCheckout/components/ConfigureCartStep";
import ConfigureAddressStep from "@/features/hostedCheckout/components/ConfigureAddressStep";
import ReviewConfirmStep from "@/features/hostedCheckout/components/ReviewConfirmStep";
import {
  CurrentStep,
  useHostedConfigurationStore,
} from "@/features/hostedCheckout/store/hostedConfigurationStore";
import Link from "@/components/ui/Link";
import { HOSTED_PAYMENT_CONFIG } from "@/features/hostedCheckout/constants/hostedPaymentConfig";

const HostedCheckout = () => {
  const { currentStep, setCurrentStep } = useHostedConfigurationStore();

  const steps = useMemo(
    () => [
      {
        id: CurrentStep.CHOOSE_ENV,
        name: "Choose Environment",
        component: ChooseEnvironmentStep,
      },
      {
        id: CurrentStep.CONFIGURE_CART,
        name: "Configure Cart",
        component: ConfigureCartStep,
      },
      {
        id: CurrentStep.CONFIGURE_ADDRESS,
        name: "Customer Information",
        component: ConfigureAddressStep,
      },
      {
        id: CurrentStep.REVIEW_CONFIRM,
        name: "Review & Confirm",
        component: ReviewConfirmStep,
      },
    ],
    []
  );

  const stepOrder = [
    CurrentStep.CHOOSE_ENV,
    CurrentStep.CONFIGURE_CART,
    CurrentStep.CONFIGURE_ADDRESS,
    CurrentStep.REVIEW_CONFIRM,
  ];

  const currentStepIndex = stepOrder.indexOf(currentStep);

  const handleStepChange = (stepIndex: number) => {
    const newStep = stepOrder[stepIndex];
    if (newStep && setCurrentStep) {
      setCurrentStep(newStep);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen font-sans">
      <Link to="/" variant="secondary" className="m-4 z-50 top-0 left-0">
        &larr; Back to Flow Selection
      </Link>
      <div className="mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">Hosted Checkout</h1>
          <p className="text-sm text-gray-500 mt-2">
            Hosted Page Version: {HOSTED_PAYMENT_CONFIG.hostedVersion}
          </p>
        </div>

        {/* Flow Explanation Section - Placeholder for Chloe's content */}
        <div className="max-w-4xl mx-auto mb-8 bg-green-50 border border-green-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-green-900 mb-3">
            About Hosted Checkout Flow
          </h2>
          <div className="text-sm text-green-800 space-y-2">
            <p>
              The Hosted Checkout integration provides a fully-managed payment
              page hosted by Payoneer. After configuring your cart and customer
              information, users are redirected to Payoneer's secure payment
              environment.
            </p>
            <p>
              This integration pattern minimizes PCI compliance requirements and
              provides a quick path to accepting payments. Follow the wizard
              steps below to set up your environment, configure cart details,
              enter customer information, and launch the hosted payment page.
            </p>
          </div>
        </div>

        <MultiStepper
          steps={steps}
          currentStep={currentStepIndex}
          onStepChange={handleStepChange}
        />
      </div>
    </div>
  );
};

export default HostedCheckout;
