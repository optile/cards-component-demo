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

export const supportsFutureUsage = ['cards'];

export const registrationOptions: Record<RegistrationType, RegistrationOption> = {
  [Registrations.GUEST]: { key: Registrations.GUEST, title: "Guest Checkout", description: "The buyer proceeds with their checkout experience without registering an account.", },
  [Registrations.CIT]: {
    key: Registrations.CIT,
    title: "Account Registration for returning buyer",
    description: "They can choose to register their account by checking the provided checkbox. If they already have a registered account they will be able to use it again for another purchase through the same store.",
    note: "Cards only - not supported for other payment methods",
  },
  [Registrations.MIT]: {
    key: Registrations.MIT,
    description: "For a subsequent Merchant Initiated Transaction (MIT) to be possible, the buyer has to first have their account registered. In this scenario the buyer is presented with a Consent message, once they proceed with the payment, their account is registered and can be used for MIT flows.",
    title: "Account Registration for MIT",
    note: "Cards only - not supported for other payment methods",
  },
};
