import React from "react";
import Checkbox from "../../../components/ui/Checkbox";
import Select from "../../../components/ui/Select";
import InfoTooltip from "../../../components/ui/InfoTooltip";
import Input from "../../../components/ui/Input";
import {
  LOG_LEVEL_OPTIONS,
  PROCEED_OPTIONS,
  CALLBACK_DESCRIPTIONS,
  CALLBACK_DOCUMENTATION_LINKS,
} from "../constants/callbacks";
import type { CallbackName, CallbackConfig } from "../types/callbacks";
import ExternalLink from "../../../components/ui/ExternalLink";

interface CallbackConfigRowProps {
  callbackName: CallbackName;
  config: CallbackConfig;
  onConfigChange: (
    field: keyof CallbackConfig,
    value: boolean | string
  ) => void;
  onReset: () => void;
}

const CallbackConfigRow: React.FC<CallbackConfigRowProps> = ({
  callbackName,
  config,
  onConfigChange,
  onReset,
}) => {
  return (
    <div className="border rounded-lg p-3 bg-white shadow-sm">
      {/* Header with callback name and description */}
      <div className="flex items-start gap-3 mb-3">
        <Checkbox
          checked={config.enabled}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            onConfigChange("enabled", e.target.checked)
          }
          label=""
          className="mt-0.5"
        />
        <div className="flex-1">
          <div className="flex items-center gap-1">
            <h4 className="font-mono text-sm font-semibold text-gray-900">
              {callbackName}
            </h4>
            <InfoTooltip content={CALLBACK_DESCRIPTIONS[callbackName]} />
            <ExternalLink link={CALLBACK_DOCUMENTATION_LINKS[callbackName]} />
            <button
              onClick={onReset}
              className="ml-auto text-xs text-gray-500 hover:text-gray-700 underline"
              type="button"
            >
              Reset
            </button>
          </div>
          <p className="text-xs text-gray-600 mt-0.5">
            {CALLBACK_DESCRIPTIONS[callbackName]}
          </p>
        </div>
      </div>

      {/* Configuration options - only visible when enabled */}
      {config.enabled && (
        <div className="ml-6 space-y-3">
          {/* Flow control and log level in same row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="w-full">
              <Select
                label="Flow Control"
                value={config.shouldProceed ? "true" : "false"}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                  onConfigChange("shouldProceed", e.target.value === "true")
                }
                options={[...PROCEED_OPTIONS]}
                id={`${callbackName}-proceed`}
              />
            </div>

            <div className="w-full">
              <Select
                label="Log Level"
                value={config.logLevel}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                  onConfigChange("logLevel", e.target.value)
                }
                options={[...LOG_LEVEL_OPTIONS]}
                id={`${callbackName}-log-level`}
              />
            </div>
          </div>

          {/* Custom message */}
          <Input
            label="Custom Message (Optional)"
            type="text"
            value={config.customMessage}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              onConfigChange("customMessage", e.target.value)
            }
            placeholder={`Default: "${callbackName} called"`}
            id={`${callbackName}-message`}
          />

          {/* Compact preview */}
          <div className="bg-gray-50 rounded p-2 border">
            <p className="text-xs text-gray-600 mb-1">Console Preview:</p>
            <div className="font-mono text-xs text-gray-800 bg-gray-100 p-2 rounded">
              <div className="truncate">
                {callbackName} -{" "}
                {config.customMessage || `${callbackName} called`}
              </div>
              <div className="text-gray-600 text-xs">
                Returns: {config.shouldProceed.toString()}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CallbackConfigRow;
