import type { CallbackName } from "../types/callbacks";

// Callback descriptions for UI tooltips and help text
export const CALLBACK_DESCRIPTIONS: Record<CallbackName, string> = {
  onBeforeCharge:
    "Called before a payment charge is processed. Return false to prevent the charge.",
  onBeforeError:
    "Called when an error occurs. Return false to prevent default error handling.",
  onPaymentSuccess:
    "Called when a payment is successful. Return false to prevent default success handling.",
  onPaymentFailure:
    "Called when a payment fails. Return false to prevent default failure handling.",
  onBeforeProviderRedirect:
    "Called before redirecting to a payment provider. Return false to prevent redirect.",
  onPaymentDeclined:
    "Called when a payment is declined. Return false to prevent default declined handling.",
};

// Log level options for UI dropdowns
export const LOG_LEVEL_OPTIONS = [
  { value: "info", label: "Info" },
  { value: "warn", label: "Warning" },
  { value: "error", label: "Error" },
] as const;

// Proceed options for UI dropdowns
export const PROCEED_OPTIONS = [
  { value: "true", label: "Yes (Continue Flow)" },
  { value: "false", label: "No (Stop Flow)" },
] as const;

// Categories for organizing callbacks in UI
export const CALLBACK_CATEGORIES = {
  payment: {
    title: "Payment Flow",
    description: "Callbacks that control the main payment process",
    callbacks: [
      "onBeforeCharge",
      "onPaymentSuccess",
      "onPaymentFailure",
      "onPaymentDeclined",
    ] as CallbackName[],
  },
  error: {
    title: "Error Handling",
    description: "Callbacks for handling errors and failures",
    callbacks: ["onBeforeError"] as CallbackName[],
  },
  redirect: {
    title: "Provider Redirect",
    description: "Callbacks for external payment provider redirects",
    callbacks: ["onBeforeProviderRedirect"] as CallbackName[],
  },
} as const;

// Default custom messages for each callback
export const DEFAULT_CALLBACK_MESSAGES: Record<CallbackName, string> = {
  onBeforeCharge: "Payment charge is about to be processed",
  onBeforeError: "An error occurred during payment processing",
  onPaymentSuccess: "Payment was processed successfully",
  onPaymentFailure: "Payment processing failed",
  onBeforeProviderRedirect: "Redirecting to payment provider",
  onPaymentDeclined: "Payment was declined",
};

// Configuration presets for common testing scenarios
export const CALLBACK_PRESETS = {
  allEnabled: {
    name: "All Enabled (Continue)",
    description: "Enable all callbacks and continue flow",
  },
  allEnabledStop: {
    name: "All Enabled (Stop)",
    description: "Enable all callbacks and stop flow",
  },
  paymentOnly: {
    name: "Payment Flow Only",
    description: "Enable only payment-related callbacks",
  },
  errorHandling: {
    name: "Error Handling",
    description: "Enable only error-related callbacks",
  },
  disabled: {
    name: "All Disabled",
    description: "Disable all callbacks",
  },
} as const;

export type CallbackPresetKey = keyof typeof CALLBACK_PRESETS;
