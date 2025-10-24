import React from "react";
import type { StepStatus } from "./types";

interface StepIndicatorProps {
  stepNumber: number;
  stepName: string;
  status: StepStatus;
  isLast?: boolean;
}

const StepIndicator: React.FC<StepIndicatorProps> = ({
  stepNumber,
  stepName,
  status,
  isLast = false,
}) => {
  const getStepIcon = () => {
    switch (status) {
      case "completed":
        return (
          <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        );
      case "current":
        return (
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
            {stepNumber}
          </div>
        );
      case "pending":
        return (
          <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-gray-500 font-semibold">
            {stepNumber}
          </div>
        );
    }
  };

  const getConnectorLine = () => {
    if (isLast) return null;

    const lineColor = status === "completed" ? "bg-green-500" : "bg-gray-300";

    return <div className={`hidden md:block flex-1 h-0.5 ${lineColor} mx-4`} />;
  };

  const getTextColor = () => {
    switch (status) {
      case "completed":
        return "text-green-700";
      case "current":
        return "text-blue-700 font-semibold";
      case "pending":
        return "text-gray-500";
    }
  };

  return (
    <div className="flex items-center">
      <div className="flex flex-col items-center">
        {getStepIcon()}
        <span className={`mt-2 text-sm text-center ${getTextColor()}`}>
          {stepNumber}. {stepName}
        </span>
      </div>
      {getConnectorLine()}
    </div>
  );
};

export default StepIndicator;
