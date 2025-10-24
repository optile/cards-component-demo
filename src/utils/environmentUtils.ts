import { Divisions } from "@/features/embeddedCheckout/constants/checkout";

export interface EnvironmentOption {
  value: string;
  label: string;
}

export interface EnvironmentOptionWithDescription extends EnvironmentOption {
  title: string;
  description: string;
}

/**
 * Creates environment options from the Divisions constant
 * Used for Select components and other environment selection UI
 */
export const createEnvironmentOptions = (): EnvironmentOption[] => {
  return Object.keys(Divisions).map((envKey) => ({
    value: envKey,
    label: envKey,
  }));
};

/**
 * Creates detailed environment options with descriptions
 * Used for radio button groups and more detailed environment selection UI
 */
export const createDetailedEnvironmentOptions =
  (): EnvironmentOptionWithDescription[] => {
    const baseOptions = createEnvironmentOptions();

    return baseOptions.map((option) => {
      const descriptions: Record<
        string,
        { title: string; description: string }
      > = {
        sandbox: {
          title: "Sandbox",
          description: "Development environment for testing",
        },
        "checkout.integration": {
          title: "Checkout Integration",
          description: "Integration testing environment",
        },
        production: {
          title: "Production",
          description: "Live environment for real transactions",
        },
      };

      const details = descriptions[option.value] || {
        title: option.label,
        description: `${option.label} environment`,
      };

      return {
        ...option,
        title: details.title,
        description: details.description,
      };
    });
  };
