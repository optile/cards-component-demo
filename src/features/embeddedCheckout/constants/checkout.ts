export const Divisions = {
  "checkout.integration": "45667",
  sandbox: "17875",
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
