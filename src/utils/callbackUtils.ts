import type { CallbackConfig, CallbackName } from "../types/callbacks";

/**
 * Creates a callback handler function that matches the pattern from index.html example
 * This is the core utility that transforms our configuration into SDK-compatible callbacks
 */
export const createCallbackHandler = (
  callbackName: CallbackName,
  config: CallbackConfig
) => {
  if (!config.enabled) {
    return undefined;
  }

  return (...args: unknown[]) => {
    const message = config.customMessage || `${callbackName} called`;

    // Choose log method based on configured level
    const logMethod =
      config.logLevel === "warn"
        ? console.warn
        : config.logLevel === "error"
        ? console.error
        : console.log;

    // Log in the same format as the index.html example
    logMethod(`\n\n ${callbackName} - ${message} \n`);
    logMethod([...args]);
    logMethod(`\n ${callbackName} - Returning: ${config.shouldProceed} \n\n`);

    // Emit custom event for UI feedback (optional)
    if (typeof window !== "undefined") {
      const customEvent = new CustomEvent("payoneer-callback-triggered", {
        detail: {
          callbackName,
          message,
          shouldProceed: config.shouldProceed,
          timestamp: new Date().toISOString(),
          args: args.length > 0 ? args : undefined,
        },
      });
      window.dispatchEvent(customEvent);
    }

    return config.shouldProceed;
  };
};

/**
 * Validates callback configuration before applying
 */
export const validateCallbackConfig = (config: CallbackConfig): string[] => {
  const errors: string[] = [];

  if (config.enabled && config.customMessage.length > 200) {
    errors.push("Custom message should be shorter than 200 characters");
  }

  return errors;
};

/**
 * Converts callback configurations to SDK format
 * Maps our internal configuration structure to what the SDK expects
 */
export const createSDKCallbackConfig = (
  configs: Record<CallbackName, CallbackConfig>
): Record<string, unknown> => {
  const sdkConfig: Record<string, unknown> = {};

  Object.entries(configs).forEach(([callbackName, config]) => {
    const handler = createCallbackHandler(callbackName as CallbackName, config);
    if (handler) {
      sdkConfig[callbackName] = handler;
    }
  });

  return sdkConfig;
};

/**
 * Gets formatted configuration summary for debugging
 */
export const getConfigSummary = (
  configs: Record<CallbackName, CallbackConfig>
): string => {
  const enabledCallbacks = Object.entries(configs)
    .filter(([, config]) => config.enabled)
    .map(
      ([name, config]) =>
        `${name}: ${config.shouldProceed ? "proceed" : "stop"}`
    )
    .join(", ");

  return enabledCallbacks || "No callbacks enabled";
};

/**
 * Event listener helper for callback events
 */
export const addCallbackEventListener = (
  callback: (event: CustomEvent) => void
): (() => void) => {
  const eventListener = (event: Event) => {
    callback(event as CustomEvent);
  };

  window.addEventListener("payoneer-callback-triggered", eventListener);

  // Return cleanup function
  return () => {
    window.removeEventListener("payoneer-callback-triggered", eventListener);
  };
};

/**
 * Debounce utility for preventing rapid configuration updates
 */
export const debounce = <T extends (...args: unknown[]) => void>(
  func: T,
  delay: number
): T => {
  let timeoutId: ReturnType<typeof setTimeout>;

  return ((...args: unknown[]) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  }) as T;
};
