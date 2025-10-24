import { Divisions } from "../constants/checkout";
import { getCallbackUrls } from "../../hostedCheckout/constants/hostedPaymentConfig";
import type {
  BillingAddress,
  ShippingAddress,
  MerchantCart,
} from "../../../types/merchant";
import { INTEGRATION_TYPE } from "../types/checkout";

export const buildListSessionUpdates = (
  merchantCart: MerchantCart,
  billingAddress: BillingAddress,
  shippingAddress: ShippingAddress,
  sameAddress: boolean,
  env: string,
  integrationType: INTEGRATION_TYPE = INTEGRATION_TYPE.EMBEDDED
) => {
  const isHosted = integrationType === INTEGRATION_TYPE.HOSTED;
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";

  const request = {
    currency: merchantCart.currency,
    amount: merchantCart.amount,
    country: billingAddress.country,
    division: Divisions[env as keyof typeof Divisions],
    customer: {
      number: billingAddress.number,
      firstName: billingAddress.firstName,
      lastName: billingAddress.lastName,
      birthday: billingAddress.birthday,
      email: billingAddress.email,
      addresses: {
        billing: {
          street: billingAddress.street,
          houseNumber: billingAddress.houseNumber,
          zip: billingAddress.zip,
          city: billingAddress.city,
          state: billingAddress.state,
          country: billingAddress.country,
          name: {
            firstName: billingAddress.firstName,
            lastName: billingAddress.lastName,
          },
        },
        shipping: sameAddress
          ? {
              street: billingAddress.street,
              houseNumber: billingAddress.houseNumber,
              zip: billingAddress.zip,
              city: billingAddress.city,
              state: billingAddress.state,
              country: billingAddress.country,
              name: {
                firstName: billingAddress.firstName,
                lastName: billingAddress.lastName,
              },
            }
          : {
              street: shippingAddress.street,
              houseNumber: shippingAddress.houseNumber,
              zip: shippingAddress.zip,
              city: shippingAddress.city,
              state: shippingAddress.state,
              country: shippingAddress.country,
              name: {
                firstName: shippingAddress.firstName,
                lastName: shippingAddress.lastName,
              },
            },
      },
    },
    integration: integrationType,
    payment: {
      amount: merchantCart.amount,
      currency: merchantCart.currency,
      reference: `ref-${Date.now()}`,
    },
    ...(isHosted && {
      callback: getCallbackUrls(baseUrl),
      style: {
        hostedVersion: "v6",
        language: "en",
      },
      preselection: {
        direction: "CHARGE",
      },
      updateOnly: false,
      allowDelete: false,
      presetFirst: false,
    }),
  };

  return request;
};

export const getCurrencySymbol = (curr: string) => {
  const symbols: { [key: string]: string } = {
    USD: "$",
    EUR: "€",
    GBP: "£",
    CNY: "¥",
    JPY: "¥",
    RUB: "₽",
  };
  return symbols[curr] || "$";
};
