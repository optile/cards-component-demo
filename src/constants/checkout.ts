export const Divisions = {
  "checkout.integration": "45667",
  sandbox: "17875",
};

export const CHECKOUT_CONFIG = {
  environment: "sandbox", // Change to "checkout.integration" for production
  preload: ["stripe:cards"],
} as const;

export const API_ENDPOINTS = {
  LIST_SESSION: `https://api.${CHECKOUT_CONFIG.environment}.oscato.com/checkout/session`,
  SDK_URL: `https://resources.${CHECKOUT_CONFIG.environment}.oscato.com/web/libraries/checkout-web/umd/checkout-web.min.js`,
} as const;
