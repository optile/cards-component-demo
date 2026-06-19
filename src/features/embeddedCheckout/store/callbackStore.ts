import { DEFAULT_CALLBACK_CONFIGS } from "@/features/embeddedCheckout/types";
import { create } from "zustand";
import type {
  CallbackConfig,
  CallbackName,
  CallbackStoreState,
} from "../types";
import { createCallbackConfigs } from "../utils/callbackUtils";
import { useCheckoutStore } from "./checkoutStore";

// Local storage key for persisting callback configurations

// Create the callback store following existing patterns
export const useCallbackStore = create<CallbackStoreState>((set, get) => ({
  // Initial state
  configs: { ...DEFAULT_CALLBACK_CONFIGS },
  hasUnsavedChanges: false,
  isApplying: false,
  error: null,

  // Actions
  updateCallbackConfig: (
    name: CallbackName,
    config: Partial<CallbackConfig>
  ) => {
    set((state) => ({
      configs: {
        ...state.configs,
        [name]: {
          ...state.configs[name],
          ...config,
        },
      },
      hasUnsavedChanges: true,
      error: null,
    }));
  },

  resetCallbacks: () => {
    set({
      configs: { ...DEFAULT_CALLBACK_CONFIGS },
      hasUnsavedChanges: true,
      error: null,
    });
  },

  resetCallback: (name: CallbackName) => {
    set((state) => ({
      configs: {
        ...state.configs,
        [name]: { ...DEFAULT_CALLBACK_CONFIGS[name] },
      },
      hasUnsavedChanges: true,
      error: null,
    }));
  },

  applyCallbacks: async () => {
    const { checkout } = useCheckoutStore.getState();

    if (!checkout) {
      set({ error: "Checkout instance not available" });
      return;
    }

    set({ isApplying: true, error: null });

    try {
      set({ hasUnsavedChanges: false });

      // Use dedicated recreate function to apply new callbacks
      await useCheckoutStore.getState().recreateCheckout();

      console.log("✅ Applied callback configuration successfully");
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to apply callback configuration";
      set({ error: errorMessage });
      console.error("Failed to apply callback configuration:", error);
    } finally {
      set({ isApplying: false });
    }
  },

  // Method to prepare SDK-compatible callback configurations
  prepareSDKCallbacks: (): Record<string, unknown> => {
    const { configs } = get();
    const callbackConfig = createCallbackConfigs(configs);

    return callbackConfig;
  },

  clearError: () => {
    set({ error: null });
  },
}));
