
export const Registrations = {
  GUEST: "GUEST",
  CIT: "CIT",
  MIT: "MIT",
} as const;

export type RegistrationType = typeof Registrations[keyof typeof Registrations];

type RegistrationOption = {
  key: RegistrationType;
  title: string;
  description: string;
  note?: string;
};

export const registrationOptions: Record<RegistrationType, RegistrationOption> = {
  [Registrations.GUEST]: { key: Registrations.GUEST, title: "Guest", description: "Continue without an account.", },
  [Registrations.CIT]: {
    key: Registrations.CIT,
    title: "CIT registration",
    description: "The customer authorizes and triggers the transaction directly at the point of payment.",
    note: "Cards only - not supported for other payment methods",
  },
  [Registrations.MIT]: {
    key: Registrations.MIT,
    description: "The merchant processes the transaction for a recurring billing.",
    title: "MIT mandate setup",
    note: "Cards only - not supported for other payment methods",
  },
};
