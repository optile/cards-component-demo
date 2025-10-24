import React from "react";
import type { StepComponentProps } from "../ui/MultiStepper";
import Button from "../ui/Button";
import { useHostedConfigurationStore } from "../../store/hostedConfigurationStore";
import { createDetailedEnvironmentOptions } from "../../utils";

const ChooseEnvironmentStep: React.FC<StepComponentProps> = ({
  goToNext,
  goToPrevious,
  isFirstStep,
  isLastStep,
}) => {
  const { env, setEnv } = useHostedConfigurationStore();
  const environments = createDetailedEnvironmentOptions();

  const handleEnvironmentChange = (value: string) => {
    if (setEnv) {
      setEnv(value);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-sm border">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">
        Choose Environment
      </h2>
      <p className="text-gray-600 mb-6">
        Select the environment you want to work with for your checkout process.
      </p>

      <div className="space-y-3 mb-8">
        {environments.map((environment) => (
          <label
            key={environment.value}
            className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
          >
            <input
              type="radio"
              name="env"
              value={environment.value}
              className="mr-3"
              checked={env === environment.value}
              onChange={(e) => handleEnvironmentChange(e.target.value)}
            />
            <div>
              <span className="font-semibold">{environment.title}</span>
              <p className="text-sm text-gray-500">{environment.description}</p>
            </div>
          </label>
        ))}
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

export default ChooseEnvironmentStep;
