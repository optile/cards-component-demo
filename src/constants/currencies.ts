export interface CurrencyOption {
  value: string;
  label: string;
  symbol?: string;
}

/**
 * Available currency options for checkout forms
 * Used across the application for currency selection
 */
export const CURRENCY_OPTIONS: CurrencyOption[] = [
  { value: "USD", label: "USD", symbol: "$" },
  { value: "EUR", label: "EUR", symbol: "€" },
  { value: "GBP", label: "GBP", symbol: "£" },
  { value: "CAD", label: "CAD", symbol: "C$" },
  { value: "AUD", label: "AUD", symbol: "A$" },
  { value: "JPY", label: "Japanese Yen", symbol: "¥" },
  { value: "CNY", label: "Chinese Yuan", symbol: "¥" },
  { value: "RUB", label: "Russian Ruble", symbol: "₽" },
] as const;
