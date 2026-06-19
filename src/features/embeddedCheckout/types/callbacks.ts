export enum CallbackVariant {
  STANDARD = "standard",
  LEGACY = "legacy",
  NEW = "new"
};

// Callback configuration for individual callbacks
export interface CallbackConfig {
  enabled: boolean;
  shouldProceed: boolean;
  customMessage: string;
  logLevel: "info" | "warn" | "error";
  variant: CallbackVariant
}

// Configuration for all supported callbacks
export interface CallbackConfigs {
  onBeforeCharge: CallbackConfig;
  onBeforeSubmit: CallbackConfig;
  onBeforeError: CallbackConfig;
  onPaymentSuccess: CallbackConfig;
  onSubmitSuccess: CallbackConfig;
  onPaymentFailure: CallbackConfig;
  onBeforeProviderRedirect: CallbackConfig;
  onPaymentDeclined: CallbackConfig;
  onSubmitError: CallbackConfig;
  onReady: CallbackConfig;
}

// Type for callback names
export type CallbackName = keyof CallbackConfigs;

// Notification-only callbacks that don't control flow (no shouldProceed)
export const NOTIFICATION_CALLBACKS: ReadonlyArray<CallbackName> = ["onReady"];

// Callback handler function signature based on index.html example
// The SDK passes various arguments, we capture them with ...args
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type CallbackHandler = (...args: any[]) => boolean | undefined;

// Store state interface for the callback store
export interface CallbackStoreState {
  // Current callback configurations
  configs: CallbackConfigs;
  showDeprecated: boolean;

  // UI state
  hasUnsavedChanges: boolean;
  isApplying: boolean;
  error: string | null;

  // Actions
  updateCallbackConfig: (
    name: CallbackName,
    config: Partial<CallbackConfig>
  ) => void;
  setShowDeprecated: (show: boolean) => void;
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
  variant: CallbackVariant.STANDARD
};

// Default configurations for all callbacks
export const DEFAULT_CALLBACK_CONFIGS: CallbackConfigs = {
  onBeforeCharge: { ...DEFAULT_CALLBACK_CONFIG, variant: CallbackVariant.LEGACY },
  onBeforeSubmit: { ...DEFAULT_CALLBACK_CONFIG, variant: CallbackVariant.NEW },
  onBeforeError: { ...DEFAULT_CALLBACK_CONFIG },
  onPaymentSuccess: { ...DEFAULT_CALLBACK_CONFIG, variant: CallbackVariant.LEGACY },
  onSubmitSuccess: { ...DEFAULT_CALLBACK_CONFIG, variant: CallbackVariant.NEW },
  onPaymentFailure: { ...DEFAULT_CALLBACK_CONFIG, variant: CallbackVariant.LEGACY },
  onBeforeProviderRedirect: { ...DEFAULT_CALLBACK_CONFIG },
  onPaymentDeclined: { ...DEFAULT_CALLBACK_CONFIG, variant: CallbackVariant.LEGACY },
  onSubmitError: { ...DEFAULT_CALLBACK_CONFIG, variant: CallbackVariant.NEW },
  onReady: { ...DEFAULT_CALLBACK_CONFIG },
};

///Deprecated — use onSubmitError instead. onPaymentFailure will be removed in a future major version. If both are provided, onSubmitError takes precedence.

export const DEPRECATED_CALLBACKS: Partial<Record<CallbackName, string>> = {
  onBeforeCharge: "Replaced by onBeforeSubmit. onBeforeSubmit takes precedence, when both callbacks are defined.",
  onPaymentSuccess: "Replaced by onSubmitSuccess. onSubmitSuccess takes precedence, when both callbacks are defined.",
  onPaymentFailure: "Replaced by onSubmitError. onSubmitError takes precedence, when both callbacks are defined.",
  onPaymentDeclined: "Replaced by onSubmitError. onSubmitError takes precedence, when both callbacks are defined."
}

// Log level options for UI
export const LOG_LEVEL_OPTIONS = [
  { value: "info", label: "Info" },
  { value: "warn", label: "Warning" },
  { value: "error", label: "Error" },
] as const;

export const callbackPairs: Partial<Record<CallbackName, CallbackName>> = {
  onBeforeCharge: 'onBeforeSubmit',
  onPaymentSuccess: 'onSubmitSuccess',
  onPaymentFailure: 'onSubmitError',
  onPaymentDeclined: 'onSubmitError',
}
