import { Divisions } from "@/features/embeddedCheckout/constants/checkout";
import { getCartTotal, getLineTotal } from "@/utils/cartUtils";
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
  registrationType?: string,
  integrationType: INTEGRATION_TYPE = INTEGRATION_TYPE.EMBEDDED,
) => {
  const isHosted = integrationType === INTEGRATION_TYPE.HOSTED;
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";

  const totalAmount = getCartTotal(merchantCart.products);

  // The demo backend reads `orderLines` and maps them to LIST `products`. `amount` is the line total
  // (all units, incl. tax and discount) so the lines add up to payment.amount and the HPP shows the cart.
  const orderLines = merchantCart.products.map((product, index) => ({
    id: String(index + 1),
    name: product.name,
    amount: getLineTotal(product),
    quantity: product.quantity,
    ...(product.taxAmount && { taxAmount: product.taxAmount }),
    ...(product.discountAmount && { discountAmount: product.discountAmount }),
    ...(product.type && { type: product.type }),
  }));

  const checkoutRegistrationConfiguration = registrationType !== 'GUEST'
    ? { checkoutConfigurationName: registrationType }
    : {};

  const request = {
    ...checkoutRegistrationConfiguration,
    currency: merchantCart.currency,
    amount: totalAmount,
    country: billingAddress.country,
    division: Divisions[env as keyof typeof Divisions],
    customer: {
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
    orderLines,
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

  // Handle case where checkout-web might not be an array (e.g., malformed meta-info)
  if (!checkoutWebVariants || !Array.isArray(checkoutWebVariants)) {
    console.warn(
      "Meta-info 'checkout-web' is not an array:",
      checkoutWebVariants
    );
    return "unknown";
  }

  const minifiedVariant = checkoutWebVariants.find(
    (variant) => variant.isMinified
  );
  return minifiedVariant ? minifiedVariant.version : "unknown";
};
