export const Divisions = {
  "checkout.integration": "45667",
  sandbox: "17875",
};

export const getApiEndpoints = (env: string) => ({
  LIST_SESSION: `https://api.${env}.oscato.com/checkout/session`,
  // https://api.sandbox.oscato.com/pci/v1/68fb27d689a708000169d192liqksga6et6blq50p549gelf50
  GET_LIST_SESSION: `https://api.${env}.oscato.com/pci/v1/`,
  SDK_URL: `https://resources.${env}.oscato.com/web/libraries/checkout-web/umd/checkout-web.min.js`,
});
