import React, { useState, useCallback } from "react";
import StepIndicator from "./StepIndicator";
import type { MultiStepperProps, StepStatus } from "./types";

const MultiStepper: React.FC<MultiStepperProps> = ({
  steps,
  currentStep = 0,
  onStepChange,
}) => {
  const [internalCurrentStep, setInternalCurrentStep] = useState(currentStep);

  const activeStep = onStepChange ? currentStep : internalCurrentStep;

  const goToNext = useCallback(() => {
    if (activeStep < steps.length - 1) {
      const newStep = activeStep + 1;
      if (onStepChange) {
        onStepChange(newStep);
      } else {
        setInternalCurrentStep(newStep);
      }
    }
  }, [activeStep, steps.length, onStepChange]);

  const goToPrevious = useCallback(() => {
    if (activeStep > 0) {
      const newStep = activeStep - 1;
      if (onStepChange) {
        onStepChange(newStep);
      } else {
        setInternalCurrentStep(newStep);
      }
    }
  }, [activeStep, onStepChange]);

  const getStepStatus = (stepIndex: number): StepStatus => {
    if (stepIndex < activeStep) return "completed";
    if (stepIndex === activeStep) return "current";
    return "pending";
  };

  const CurrentStepComponent = steps[activeStep]?.component;

  if (!CurrentStepComponent) {
    return <div>No steps provided</div>;
  }

  return (
    <div className="w-full">
      {/* Desktop Step Indicators */}
      <div className="hidden md:flex items-center justify-between mb-8 px-4">
        {steps.map((step, index) => (
          <StepIndicator
            key={step.id}
            stepNumber={index + 1}
            stepName={step.name}
            status={getStepStatus(index)}
            isLast={index === steps.length - 1}
          />
        ))}
      </div>

      {/* Mobile Step Indicator */}
      <div className="md:hidden mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
              {activeStep + 1}
            </div>
            <span className="text-sm font-medium text-gray-700">
              {steps[activeStep]?.name}
            </span>
          </div>
          <span className="text-xs text-gray-500">
            Step {activeStep + 1} of {steps.length}
          </span>
        </div>
      </div>

      {/* Step Content */}
      <div className="w-full">
        <CurrentStepComponent
          goToNext={goToNext}
          goToPrevious={goToPrevious}
          isFirstStep={activeStep === 0}
          isLastStep={activeStep === steps.length - 1}
        />
      </div>
    </div>
  );
};

export default MultiStepper;
