export const Divisions = {
  "checkout.integration": "45667",
  sandbox: "17875",
};

export const getApiEndpoints = (env: string) => ({
  LIST_SESSION: `https://api.${env}.oscato.com/checkout/session`,
  SDK_URL: `https://resources.${env}.oscato.com/web/libraries/checkout-web/umd/checkout-web.min.js`,
});
