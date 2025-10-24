import type {
  BillingAddress,
  ShippingAddress,
} from "../store/configurationStore";

/**
 * Format currency amount with proper locale and currency symbol
 */
export const formatCurrency = (amount: number, currency: string): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
  }).format(amount);
};

/**
 * Format address object into a readable string
 */
export const formatAddress = (
  address: BillingAddress | ShippingAddress
): string => {
  const parts = [
    address.street,
    address.houseNumber,
    address.city,
    address.state,
    address.zip,
    address.country,
  ].filter(Boolean);
  return parts.join(", ");
};

/**
 * Format full name from first and last name
 */
export const formatFullName = (firstName: string, lastName: string): string => {
  return `${firstName} ${lastName}`.trim();
};
