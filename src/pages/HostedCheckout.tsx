import { useMemo } from "react";
import { MultiStepper } from "../components/ui/MultiStepper";
import ChooseEnvironmentStep from "../components/hostedCheckoutComponents/ChooseEnvironmentStep";
import ConfigureCartStep from "../components/hostedCheckoutComponents/ConfigureCartStep";
import ConfigureAddressStep from "../components/hostedCheckoutComponents/ConfigureAddressStep";
import ReviewConfirmStep from "../components/hostedCheckoutComponents/ReviewConfirmStep";
import {
  CurrentStep,
  useHostedConfigurationStore,
} from "../store/hostedConfigurationStore";

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
    <div>
      <MultiStepper
        steps={steps}
        currentStep={currentStepIndex}
        onStepChange={handleStepChange}
      />
    </div>
  );
};

export default HostedCheckout;
