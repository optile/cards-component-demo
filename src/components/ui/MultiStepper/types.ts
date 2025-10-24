import type { ComponentType } from "react";

export interface StepComponentProps {
  goToNext: () => void;
  goToPrevious: () => void;
  isFirstStep: boolean;
  isLastStep: boolean;
}

export interface Step {
  id: number | string;
  name: string;
  component: ComponentType<StepComponentProps>;
}

export interface MultiStepperProps {
  steps: Step[];
  currentStep?: number;
  onStepChange?: (stepIndex: number) => void;
}

export type StepStatus = "completed" | "current" | "pending";
