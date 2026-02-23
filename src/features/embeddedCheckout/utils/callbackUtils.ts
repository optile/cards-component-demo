import { useVisualizationStore } from "../store/visualizationStore";
import type { CallbackConfigs, CallbackConfig } from "../types";
import { NOTIFICATION_CALLBACKS } from "../types/callbacks";

const LOG_METHOD_MAP = {
  warn: console.warn,
  error: console.error,
  info: console.log,
} as const;

function getLogMethod(level: CallbackConfig["logLevel"]) {
  return LOG_METHOD_MAP[level] ?? console.log;
}

function getEndResult(
  isNotificationOnly: boolean,
  shouldProceed: boolean
): string {
  if (isNotificationOnly) return "notified";
  return shouldProceed ? "proceed" : "stop";
}

function buildStartMeta(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  args: any[],
  isNotificationOnly: boolean,
  shouldProceed: boolean,
  correlationId: string
) {
  const meta: Record<string, unknown> = { args, correlationId };
  if (!isNotificationOnly) {
    meta.shouldProceed = shouldProceed;
  }
  return meta;
}

export const createCallbackConfigs = (configs: CallbackConfigs) => {
  const callbackConfig: Record<string, unknown> = {};

  Object.entries(configs).forEach(([callbackName, config]) => {
    if (!config.enabled) return;

    const isNotificationOnly = NOTIFICATION_CALLBACKS.includes(
      callbackName as keyof CallbackConfigs
    );

    // Create the callback handler using the same pattern as index.html
    // Wrap to emit visualization events and apply real delay
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    callbackConfig[callbackName] = async (...args: any[]) => {
      try {
        const viz = useVisualizationStore.getState();

        // create a correlation id for this callback invocation so start/end can be matched
        const correlationId = `${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 8)}`;

        // Emit visualization events and apply delay
        if (viz.enabled) {
          useVisualizationStore.getState().addEvent({
            type: "callback",
            name: callbackName,
            phase: "start",
            meta: buildStartMeta(
              args,
              isNotificationOnly,
              config.shouldProceed,
              correlationId
            ),
          });

          const delay = viz.delayMs || 0;
          if (delay > 0) {
            await new Promise((res) => setTimeout(res, delay));
          }
        }

        // Log based on log level
        const message = config.customMessage || `${callbackName} called`;
        const logMethod = getLogMethod(config.logLevel);
        logMethod(`\n\n ${callbackName} - ${message} \n`);
        logMethod(args);

        if (!isNotificationOnly) {
          logMethod(
            `\n ${callbackName} - Returning: ${config.shouldProceed} \n\n`
          );
        }

        // Emit callback 'end' event with result and same correlationId
        if (viz.enabled) {
          useVisualizationStore.getState().addEvent({
            type: "callback",
            name: callbackName,
            phase: "end",
            meta: {
              args,
              result: getEndResult(isNotificationOnly, config.shouldProceed),
              correlationId,
            },
          });
        }

        // Notification-only callbacks don't control flow
        if (!isNotificationOnly) {
          return config.shouldProceed;
        }
      } catch (e) {
        console.error("Callback wrapper error", e);
        if (!isNotificationOnly) {
          return config.shouldProceed;
        }
      }
    };
  });
  return callbackConfig;
};
