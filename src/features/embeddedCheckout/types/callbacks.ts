// Callback configuration for individual callbacks
export interface CallbackConfig {
  enabled: boolean;
  shouldProceed: boolean;
  customMessage: string;
  logLevel: "info" | "warn" | "error";
}

// Configuration for all supported callbacks
export interface CallbackConfigs {
  onBeforeCharge: CallbackConfig;
  onBeforeError: CallbackConfig;
  onPaymentSuccess: CallbackConfig;
  onPaymentFailure: CallbackConfig;
  onBeforeProviderRedirect: CallbackConfig;
  onPaymentDeclined: CallbackConfig;
}

// Type for callback names
export type CallbackName = keyof CallbackConfigs;

// Callback handler function signature based on index.html example
// The SDK passes various arguments, we capture them with ...args
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type CallbackHandler = (...args: any[]) => boolean | undefined;

// Store state interface for the callback store
export interface CallbackStoreState {
  // Current callback configurations
  configs: CallbackConfigs;

  // UI state
  hasUnsavedChanges: boolean;
  isApplying: boolean;
  error: string | null;

  // Actions
  updateCallbackConfig: (
    name: CallbackName,
    config: Partial<CallbackConfig>
  ) => void;
  resetCallbacks: () => void;
  resetCallback: (name: CallbackName) => void;
  applyCallbacks: () => Promise<void>;
  prepareSDKCallbacks: () => Record<string, unknown>; // New method for SDK integration
  clearError: () => void;
}

// Default configuration for a single callback
export const DEFAULT_CALLBACK_CONFIG: CallbackConfig = {
  enabled: false,
  shouldProceed: false,
  customMessage: "",
  logLevel: "info",
};

// Default configurations for all callbacks
export const DEFAULT_CALLBACK_CONFIGS: CallbackConfigs = {
  onBeforeCharge: { ...DEFAULT_CALLBACK_CONFIG },
  onBeforeError: { ...DEFAULT_CALLBACK_CONFIG },
  onPaymentSuccess: { ...DEFAULT_CALLBACK_CONFIG },
  onPaymentFailure: { ...DEFAULT_CALLBACK_CONFIG },
  onBeforeProviderRedirect: { ...DEFAULT_CALLBACK_CONFIG },
  onPaymentDeclined: { ...DEFAULT_CALLBACK_CONFIG },
};

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

// Log level options for UI
export const LOG_LEVEL_OPTIONS = [
  { value: "info", label: "Info" },
  { value: "warn", label: "Warning" },
  { value: "error", label: "Error" },
] as const;
