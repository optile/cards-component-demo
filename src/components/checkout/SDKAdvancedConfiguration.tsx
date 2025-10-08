import React, { useEffect } from "react";
import { CALLBACK_CATEGORIES } from "../../constants/callbacks";
import { useCallbackStore } from "../../store/callbackStore";
import { useCheckoutStore } from "../../store/checkoutStore";
import type { CallbackConfig, CallbackName } from "../../types/callbacks";
import Button from "../ui/Button";
import CallbackConfigRow from "./CallbackConfigRow";

const SDKAdvancedConfiguration: React.FC = () => {
  const { checkout, checkoutLoading, checkoutError } = useCheckoutStore();
  const {
    configs,
    hasUnsavedChanges,
    isApplying,
    error: callbackError,
    updateCallbackConfig,
    resetCallbacks,
    resetCallback,
    applyCallbacks,
    clearError,
  } = useCallbackStore();

  // Clear errors when component mounts
  useEffect(() => {
    clearError();
  }, [clearError]);

  const handleConfigChange = (
    callbackName: CallbackName,
    field: keyof CallbackConfig,
    value: boolean | string
  ) => {
    updateCallbackConfig(callbackName, { [field]: value });
  };

  const handleResetCallback = (callbackName: CallbackName) => {
    resetCallback(callbackName);
  };

  const handleApplyConfiguration = async () => {
    await applyCallbacks();
  };

  const handleResetAll = () => {
    resetCallbacks();
  };

  const enabledCount = Object.values(configs).filter(
    (config) => config.enabled
  ).length;
  const totalCount = Object.keys(configs).length;

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            SDK Advanced Configuration
          </h3>
          <p className="text-sm text-gray-600">
            Configure callback handlers for payment flow control ({enabledCount}
            /{totalCount} enabled)
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleResetAll}
            variant="secondary"
            disabled={checkoutLoading}
          >
            Reset All
          </Button>
        </div>
      </div>

      {/* Info banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <div className="flex items-start gap-2">
          <span className="text-blue-600 text-sm">ℹ️</span>
          <div className="text-sm text-blue-800">
            <strong>Callback Configuration:</strong> These callbacks control the
            payment flow. When enabled, they will log information to the console
            and either continue or stop the flow based on your "Flow Control"
            setting.
          </div>
        </div>
      </div>

      {/* Error display */}
      {(callbackError || checkoutError) && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <span className="text-red-800 text-sm">
            ⚠️ {callbackError || checkoutError}
          </span>
          {callbackError && (
            <button
              onClick={clearError}
              className="ml-2 text-xs text-red-600 hover:text-red-800 underline"
            >
              Dismiss
            </button>
          )}
        </div>
      )}

      {/* Scrollable callback categories */}
      <div className="flex-1 overflow-y-auto space-y-4">
        {Object.entries(CALLBACK_CATEGORIES).map(([categoryKey, category]) => (
          <div key={categoryKey} className="space-y-3">
            <div>
              <h4 className="font-medium text-gray-700">{category.title}</h4>
              <p className="text-sm text-gray-600">{category.description}</p>
            </div>

            <div className="space-y-2">
              {category.callbacks.map((callbackName) => (
                <CallbackConfigRow
                  key={callbackName}
                  callbackName={callbackName}
                  config={configs[callbackName]}
                  onConfigChange={(field, value) =>
                    handleConfigChange(callbackName, field, value)
                  }
                  onReset={() => handleResetCallback(callbackName)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Apply button - fixed at bottom */}
      <div className="flex gap-3 pt-3 border-t bg-white">
        <Button
          onClick={handleApplyConfiguration}
          disabled={!hasUnsavedChanges || isApplying || !checkout}
        >
          {isApplying ? "Applying..." : "Apply Configuration"}
        </Button>

        {!checkout && (
          <span className="text-red-600 text-sm flex items-center">
            ⚠️ Checkout instance not available
          </span>
        )}

        {hasUnsavedChanges && (
          <span className="text-orange-600 text-sm flex items-center">
            ⚡ You have unsaved changes
          </span>
        )}
      </div>
    </div>
  );
};

export default SDKAdvancedConfiguration;
