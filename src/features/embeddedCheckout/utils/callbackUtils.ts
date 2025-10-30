import { useVisualizationStore } from "../store/visualizationStore";
import type { CallbackConfigs } from "../types";

export const createCallbackConfigs = (configs: CallbackConfigs) => {
  const callbackConfig: Record<string, unknown> = {};

  Object.entries(configs).forEach(([callbackName, config]) => {
    if (config.enabled) {
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

          // Emit callback 'start' event
          if (viz.enabled) {
            useVisualizationStore.getState().addEvent({
              type: "callback",
              name: callbackName,
              phase: "start",
              meta: {
                args,
                shouldProceed: config.shouldProceed,
                correlationId,
              },
            });

            // Apply blocking delay to simulate integrator logic
            const delay = viz.delayMs || 0;
            if (delay > 0) {
              // blocking wait
              await new Promise((res) => setTimeout(res, delay));
            }
          }

          // Log based on log level
          const message = config.customMessage || `${callbackName} called`;
          const logMethod =
            config.logLevel === "warn"
              ? console.warn
              : config.logLevel === "error"
              ? console.error
              : console.log;
          logMethod(`\n\n ${callbackName} - ${message} \n`);
          logMethod(args);
          logMethod(
            `\n ${callbackName} - Returning: ${config.shouldProceed} \n\n`
          );

          // Emit callback 'end' event with result and same correlationId
          if (viz.enabled) {
            useVisualizationStore.getState().addEvent({
              type: "callback",
              name: callbackName,
              phase: "end",
              meta: {
                args,
                result: config.shouldProceed ? "proceed" : "stop",
                correlationId,
              },
            });
          }

          // Removed separate overall 'end' event for payment success/failure to avoid redundant/empty rows

          return config.shouldProceed;
        } catch (e) {
          console.error("Callback wrapper error", e);
          return config.shouldProceed;
        }
      };
    }
  });
  return callbackConfig;
};
