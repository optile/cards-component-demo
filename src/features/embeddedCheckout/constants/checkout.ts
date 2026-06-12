export const Divisions = {
  "integration": "NON_THREE_DS",
  sandbox: "17875",
};

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

export interface LocalModeConfig {
  enabled: boolean;
  checkoutWebAvailable: boolean;
  checkoutWebStripeAvailable: boolean;
}

export const getApiEndpoints = (env: string, localMode?: LocalModeConfig) => {
  const useLocalCheckoutWeb =
    localMode?.enabled && localMode?.checkoutWebAvailable;
  const useLocalStripe =
    localMode?.enabled && localMode?.checkoutWebStripeAvailable;

  return {
    LIST_SESSION: `https://api.${env}.oscato.com/checkout/session`,
    SDK_URL: useLocalCheckoutWeb
      ? `/local-checkout-web/build/umd/checkout-web.min.js`
      : `https://resources.${env}.oscato.com/web/libraries/checkout-web/umd/checkout-web.min.js`,
    META_INFO: useLocalCheckoutWeb
      ? `/local-checkout-web/build/meta-info.json`
      : `https://resources.${env}.oscato.com/web/libraries/checkout-web/meta-info.json`,
    // This will be used by checkout-web when fetching stripe meta-info
    STRIPE_META_INFO_OVERRIDE: useLocalStripe
      ? `/local-checkout-web-stripe/meta-info.json`
      : undefined,
  };
};
