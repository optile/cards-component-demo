import { registrationOptions, Registrations, type RegistrationType } from "@/features/embeddedCheckout/constants/checkout";

export interface RegistrationOption {
  value: RegistrationType;
  label: string;
}

export interface RegistrationOptionWithDescription extends RegistrationOption {
  title: string;
  description: string;
  note?: string;
}

/**
 * Creates environment options from the Registrations constant
 * Used for Select components
 */
export const createRegistrationOptions = (): RegistrationOption[] => {
  return Object.keys(Registrations).map((regKey) => ({
    value: regKey as RegistrationType,
    label: regKey,
  }));
};

/**
 * Creates detailed environment options with descriptions
 * Used for radio button groups and more detailed environment selection UI
 */
export const createDetailedRegistrationOptions =
  (): RegistrationOptionWithDescription[] => {
    const baseOptions = createRegistrationOptions();

    return baseOptions.map((option) => {
      const descriptions: Record<
        string,
        { title: string; description: string, note?: string }
      > = {
        ...registrationOptions
      };

      const details = descriptions[option.value] || {
        title: option.label,
        description: `${option.label} environment`,
      };

      return {
        ...option,
        title: details.title,
        description: details.description,
        note: details.note
      };
    });
  };
