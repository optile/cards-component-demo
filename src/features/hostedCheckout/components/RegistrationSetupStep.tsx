import React from "react";
import type { StepComponentProps } from "@/components/ui/MultiStepper";
import Button from "@/components/ui/Button";
import { useHostedConfigurationStore } from "@/features/hostedCheckout/store/hostedConfigurationStore";
import { createDetailedRegistrationOptions } from "@/utils/registrationTypes";
import type { RegistrationType } from "@/features/embeddedCheckout/constants";
import Tooltip from "@/components/ui/Tooltip";
import Icon from "@/components/ui/Icon";

const RegistrationSetupStep: React.FC<StepComponentProps> = ({
  goToNext,
  goToPrevious,
  isFirstStep,
  isLastStep,
}) => {
  const { checkoutConfigurationName, setRegistrationType } = useHostedConfigurationStore();
  const registrations = createDetailedRegistrationOptions();

  const handleRegistrationTypeChange = (value: RegistrationType) => {
    if (setRegistrationType) {
      setRegistrationType(value);
    }
  };

  return (
     <div className="p-6 bg-white rounded-lg shadow-sm border">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">
        Select Registration type
      </h2>
      <p className="text-gray-600 mb-6">
        Select the registration type you want to work with for your checkout
        process.
      </p>

      <div className="space-y-3 mb-8">
        {registrations.map((registration) => {
          const registrationContent = (
            <>
              <input
                type="radio"
                name="env"
                value={registration.value}
                className="mr-3"
                checked={checkoutConfigurationName === registration.value}
                onChange={(e) => handleRegistrationTypeChange(e.target.value as RegistrationType)}
              />

              {registration.title}
            </>
          );

          return (
            <label
              key={registration.value}
              className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
            >
              <div>
                <p className="text-sm font-medium text-gray-900 mb-0.5">
                  {registration?.note ? (
                    <Tooltip
                      content={registration.note}
                      childClassName="items-center"
                    >
                      <>
                        {registrationContent}
                        <Icon
                          name="info"
                          size={14}
                          className="flex flex-inline ml-1 justify-center"
                        />
                      </>
                    </Tooltip>
                  ) : (
                    registrationContent
                  )}
                </p>

                <p className="text-sm text-gray-500 leading-relaxed">
                  {registration.description}
                </p>
              </div>
            </label>
          );
        })}
      </div>

      <div className="flex justify-between">
        <Button
          onClick={goToPrevious}
          disabled={isFirstStep}
          variant="secondary"
          className="text-gray-600 border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </Button>
        <Button
          onClick={goToNext}
          disabled={isLastStep}
          variant="primary"
          className="px-6 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </Button>
      </div>
    </div>
  );
};

export default RegistrationSetupStep;
