import React, { useEffect } from "react";
import { CALLBACK_CATEGORIES } from "@/features/embeddedCheckout/constants/callbacks";
import { useCallbackStore } from "@/features/embeddedCheckout/store/callbackStore";
import { useCheckoutStore } from "@/features/embeddedCheckout/store/checkoutStore";
import {
  callbackPairs,
  CallbackVariant,
  DEPRECATED_CALLBACKS,
  type CallbackConfig,
  type CallbackName,
} from "@/features/embeddedCheckout/types/callbacks";
import Button from "@/components/ui/Button";
import CallbackConfigRow from "./CallbackConfigRow";
import ExternalLink from "@/components/ui/ExternalLink";
import ChargeFlowVisualizer from "@/features/embeddedCheckout/components/ChargeFlowVisualizer";

const SDKAdvancedConfiguration: React.FC = () => {
  const { checkout, checkoutLoading, checkoutError } = useCheckoutStore();
  const {
    configs,
    showDeprecated,
    hasUnsavedChanges,
    isApplying,
    error: callbackError,
    updateCallbackConfig,
    setShowDeprecated,
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
          <h3 className="text-lg font-semibold text-gray-900 flex gap-1 items-center">
            SDK Advanced Configuration
            <ExternalLink link="https://checkoutdocs.payoneer.com/checkout-2/docs/advanced-use-cases" />
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
      <ChargeFlowVisualizer />
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
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-gray-600"></span>
        <div className="flex flex-col items-end gap-1">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <span className="text-sm text-gray-400">Show legacy callbacks</span>
            <div className="relative">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={showDeprecated}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setShowDeprecated(e.target.checked)
                }
              />
              <div className="w-8 h-[18px] rounded-full bg-gray-200 peer-checked:bg-gray-400 transition-colors" />
              <div className="absolute top-0.5 left-0.5 w-3.5 h-3.5 rounded-full bg-white transition-transform peer-checked:translate-x-[14px]" />
            </div>
          </label>
          {showDeprecated && (
            <span className="text-[11px] text-gray-400">
              Read-only / New callback takes precedence
            </span>
          )}
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
        {Object.entries(CALLBACK_CATEGORIES).map(([categoryKey, category]) => {
          const categoryCallbacks = !showDeprecated
          ? category.callbacks.filter((clbName) => !DEPRECATED_CALLBACKS[clbName])
          : category.callbacks;

          return (
          <div key={categoryKey} className="space-y-3">
            <div>
              <h4 className="font-medium text-gray-700">{category.title}</h4>
              <p className="text-sm text-gray-600">{category.description}</p>
            </div>
            <div className="space-y-2">
              {categoryCallbacks.map((callbackName) => {
                const callbackPairName = callbackPairs[callbackName];
                const config = callbackPairName
                ? {...configs[callbackPairName], variant: CallbackVariant.LEGACY}
                : configs[callbackName];

                return (
                  <CallbackConfigRow
                    key={callbackName}
                    callbackName={callbackName}
                    config={config}
                    onConfigChange={(field, value) =>
                      handleConfigChange(callbackName, field, value)
                    }
                    onReset={() => handleResetCallback(callbackName)}
                  />
                );
              })}
            </div>
          </div>
          )
        })}
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
