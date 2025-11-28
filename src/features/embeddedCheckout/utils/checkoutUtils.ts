import { Divisions } from "@/features/embeddedCheckout/constants/checkout";
import { getCallbackUrls } from "@/features/hostedCheckout/constants/hostedPaymentConfig";
import type {
  BillingAddress,
  ShippingAddress,
  MerchantCart,
} from "@/types/merchant";
import {
  INTEGRATION_TYPE,
  type CheckoutWebMetaInfo,
} from "@/features/embeddedCheckout/types/checkout";

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

  // Calculate total amount from products
  const totalAmount = merchantCart.products.reduce(
    (total, product) => total + product.price * product.quantity,
    0
  );

  // Map products to API format (name and amount where amount is the line total)
  const products = merchantCart.products.map((product) => ({
    name: product.name,
    amount: product.price * product.quantity,
  }));

  const request = {
    currency: merchantCart.currency,
    amount: totalAmount,
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
      amount: totalAmount,
      currency: merchantCart.currency,
      reference: `ref-${Date.now()}`,
    },
    products,
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

export const extractSdkVersionFromMetaInfo = (sdkMI: CheckoutWebMetaInfo) => {
  const checkoutWebVariants = sdkMI["checkout-web"];
  const minifiedVariant = checkoutWebVariants.find(
    (variant) => variant.isMinified
  );
  return minifiedVariant ? minifiedVariant.version : "unknown";
};
