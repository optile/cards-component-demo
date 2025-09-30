import type { ListSessionRequest } from "../types/checkout";

export const API_ENDPOINTS = {
  LIST_SESSION: "https://api.sandbox.oscato.com/checkout/session",
  SDK_URL:
    "https://resources.sandbox.oscato.com/web/libraries/checkout-web/umd/checkout-web.min.js",
} as const;

export const CHECKOUT_CONFIG = {
  environment: "sandbox",
  preload: ["stripe:cards"],
} as const;

// Use the exact same listRequest structure as working vanilla JS
export const DEFAULT_LIST_REQUEST: ListSessionRequest = {
  currency: "USD",
  amount: 15,
  country: "US",
  division: "17875",
  customer: {
    number: "777",
    firstName: "John",
    lastName: "Doe",
    birthday: "1977-09-13",
    email: "john_doe@email-domain.com",
  },
};
