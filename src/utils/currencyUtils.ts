import { CURRENCY_OPTIONS } from "@/constants/currencies";

/**
 * Get currency symbol by currency code
 */
export const getCurrencySymbol = (currencyCode: string): string => {
  const currency = CURRENCY_OPTIONS.find(
    (option) => option.value === currencyCode
  );
  return currency?.symbol || currencyCode;
};

/**
 * Format amount with currency symbol
 */
export const formatCurrency = (
  amount: number,
  currencyCode: string
): string => {
  const symbol = getCurrencySymbol(currencyCode);
  return `${symbol}${amount.toFixed(2)}`;
};
