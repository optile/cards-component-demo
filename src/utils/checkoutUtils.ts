import { Divisions } from "../constants/checkout";
import type {
  BillingAddress,
  ShippingAddress,
  MerchantCart,
} from "../store/configuration";

export const buildListSessionUpdates = (
  merchantCart: MerchantCart,
  billingAddress: BillingAddress,
  shippingAddress: ShippingAddress,
  sameAddress: boolean,
  env: string
) => {
  return {
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
    payment: {
      amount: merchantCart.amount,
      currency: merchantCart.currency,
    },
  };
};
