import { create } from "zustand";
import { CheckoutApiService } from "../services/checkoutApi";
import { PayoneerSDKUtils } from "../utils/payoneerSdk";
import { useConfigurationStore } from "./configurationStore";
import { buildListSessionUpdates } from "../utils/checkoutUtils";
import type {
  CheckoutInstance,
  DropInComponent,
  ListSessionResponse,
  PaymentMethod,
  ListSessionRequest,
  CheckoutInstanceConfig,
} from "../types/checkout";

interface CheckoutState {
  // Session state
  listSessionData: ListSessionResponse | null;
  sessionLoading: boolean;
  sessionError: string | null;
  isSessionInitialized: boolean;

  // Checkout state
  checkout: CheckoutInstance | null;
  checkoutLoading: boolean;
  checkoutError: string | null;
  isCheckoutInitialized: boolean;
  env: string; // New: Current environment
  preload: string[]; // New: Preload array
  isEnvChanging: boolean; // New: Flag to prevent updates during env change
  refetchListBeforeCharge: boolean; // New: Toggle for refetching list before charge

  // Payment methods state
  activeNetwork: string;
  availableMethods: PaymentMethod[];
  dropIns: DropInComponent[];
  isSubmitting: boolean;
  areComponentsMounted: boolean;

  // Actions
  initSession: () => Promise<void>;
  initCheckout: (
    listSessionId: string,
    navigate: (path: string) => void
  ) => Promise<void>;
  updateListSession: (
    updates: ListSessionRequest,
    listSessionId: string,
    transactionId: string
  ) => Promise<void>;
  setAvailableMethods: (methods: PaymentMethod[]) => void;
  setActiveNetwork: (network: string) => void;
  getActiveDropIn: () => DropInComponent | undefined;
  updateSdkConfig: (
    partialConfig: Partial<CheckoutInstanceConfig>
  ) => Promise<void>; // New action
  recreateCheckout: () => Promise<void>; // New dedicated recreation function
}

export const useCheckoutStore = create<CheckoutState>((set, get) => ({
  // Initial state
  listSessionData: null,
  sessionLoading: true,
  sessionError: null,
  isSessionInitialized: false,

  checkout: null,
  checkoutLoading: false,
  checkoutError: null,
  isCheckoutInitialized: false,
  env: "sandbox",
  preload: ["stripe:cards"], // Initialize preload
  isEnvChanging: false, // Initialize flag
  refetchListBeforeCharge: false, // Initialize refetch toggle

  activeNetwork: "",
  availableMethods: [],
  dropIns: [],
  isSubmitting: false,
  areComponentsMounted: false,

  // Actions
  initSession: async () => {
    const { isSessionInitialized } = get();
    if (isSessionInitialized) return;
    set({ sessionLoading: true });
    try {
      const configState = useConfigurationStore.getState();
      const initialRequest = buildListSessionUpdates(
        configState.merchantCart,
        configState.billingAddress,
        configState.shippingAddress,
        configState.sameAddress,
        get().env
      );
      const response = await CheckoutApiService.generateListSession(
        initialRequest,
        get().env
      );
      set({
        listSessionData: response,
        sessionError: null,
        isSessionInitialized: true,
      });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to generate list session";
      set({ sessionError: errorMessage });
      console.error("Failed to generate list session:", err);
    } finally {
      set({ sessionLoading: false });
    }
  },

  initCheckout: async (listSessionId, navigate) => {
    const { isCheckoutInitialized } = get();
    if (!listSessionId || isCheckoutInitialized) return;
    set({ checkoutLoading: true });
    try {
      // Load callback configurations from callback store
      const { useCallbackStore } = await import("./callbackStore");
      const callbackConfigs = useCallbackStore.getState().prepareSDKCallbacks();

      const checkoutInstance = await PayoneerSDKUtils.initCheckout(
        listSessionId,
        get().env,
        get().preload,
        get().refetchListBeforeCharge,
        callbackConfigs
      );

      set({
        checkout: checkoutInstance,
        checkoutError: null,
        isCheckoutInitialized: true,
      });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to initialize checkout";
      set({ checkoutError: errorMessage });
      console.error("Failed to initialize checkout:", err);
      navigate("/failed");
    } finally {
      set({ checkoutLoading: false });
    }
  },

  updateListSession: async (updates, listSessionId, transactionId) => {
    const { checkout, isEnvChanging } = get();
    if (!checkout || !listSessionId || !transactionId || isEnvChanging) return;
    const updatedListSessionObject = {
      ...updates,
      transactionId,
    };
    const response = await CheckoutApiService.updateListSession(
      listSessionId,
      updatedListSessionObject,
      get().env
    );
    if (!response.ok) {
      console.error("Failed to update list session:", response.statusText);
      return;
    }

    await checkout.update({});
  },

  setAvailableMethods: (methods) => {
    set({ availableMethods: methods });
    const { activeNetwork } = get();
    if (methods.length > 0 && !activeNetwork) {
      set({ activeNetwork: methods[0].name });
    }
  },

  setActiveNetwork: (network) => set({ activeNetwork: network }),

  getActiveDropIn: () => {
    const { dropIns, availableMethods, activeNetwork } = get();
    return dropIns.find(
      (_, index) => availableMethods[index].name === activeNetwork
    );
  },

  updateSdkConfig: async (partialConfig: Partial<CheckoutInstanceConfig>) => {
    const { checkout } = get();
    if (!checkout) {
      set({ checkoutError: "Checkout not initialized" });
      return;
    }

    set({
      checkoutLoading: true,
      checkoutError: null,
      isEnvChanging: true,
    });

    try {
      // Update environment settings in store first
      if (partialConfig.env) {
        set({ env: partialConfig.env });
      }
      if (partialConfig.preload) {
        set({ preload: partialConfig.preload });
      }

      if (partialConfig.refetchListBeforeCharge)
        set({ refetchListBeforeCharge: partialConfig.refetchListBeforeCharge });

      // For environment changes, we need a new session
      if (partialConfig.env) {
        // Build new list session updates with new env
        const configState = useConfigurationStore.getState();
        const newUpdates = buildListSessionUpdates(
          configState.merchantCart,
          configState.billingAddress,
          configState.shippingAddress,
          configState.sameAddress,
          partialConfig.env
        );

        // Generate new list session
        const newListSession = await CheckoutApiService.generateListSession(
          newUpdates,
          partialConfig.env
        );
        set({ listSessionData: newListSession });
      }

      // Use dedicated recreate function to apply all changes
      await get().recreateCheckout();

      set({ checkoutError: null, isEnvChanging: false });
      console.log("✅ SDK configuration updated successfully");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to update environment";
      set({ checkoutError: errorMessage });
      console.error("Failed to update environment:", err);
    } finally {
      set({ checkoutLoading: false, isEnvChanging: false }); // Reset flag
    }
  },

  recreateCheckout: async () => {
    const { checkout, listSessionData } = get();

    if (!checkout) {
      set({ checkoutError: "Checkout not initialized" });
      return;
    }

    set({
      checkoutLoading: true,
      checkoutError: null,
    });

    try {
      // Step 1: Cleanup existing checkout instance
      const { checkout, dropIns } = get();

      if (!checkout) {
        throw new Error("No existing checkout instance to recreate");
      }

      // Unmount all existing DropIn components
      dropIns.forEach((dropIn) => {
        try {
          dropIn.unmount();
        } catch (error) {
          console.warn("Failed to unmount component:", error);
        }
      });

      // Clear UI state
      set({
        dropIns: [],
        areComponentsMounted: false,
        activeNetwork: "",
        checkout: null,
        isCheckoutInitialized: false,
      });

      // Step 2: Use existing session (no session recreation needed for callback changes)
      const sessionIdToUse = listSessionData?.id;

      if (!sessionIdToUse) {
        throw new Error("No list session available for checkout recreation");
      }

      // Step 3: Read current callback configuration from callback store
      const { useCallbackStore } = await import("./callbackStore");
      const callbackConfig = useCallbackStore.getState().prepareSDKCallbacks();

      // Step 4: Read current environment and preload settings from checkout store
      const currentEnv = get().env;
      const currentPreload = get().preload;
      const currentRefetch = get().refetchListBeforeCharge;

      // Step 5: Create new checkout instance with current settings
      const newCheckoutInstance = await PayoneerSDKUtils.initCheckout(
        sessionIdToUse,
        currentEnv,
        currentPreload,
        currentRefetch,
        callbackConfig
      );

      // Step 6: Update store with new instance
      set({
        checkout: newCheckoutInstance,
        isCheckoutInitialized: true,
        checkoutError: null,
      });

      console.log("✅ Checkout instance recreated successfully");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to recreate checkout";
      set({ checkoutError: errorMessage });
      console.error("Failed to recreate checkout:", err);
    } finally {
      set({ checkoutLoading: false });
    }
  },
}));
