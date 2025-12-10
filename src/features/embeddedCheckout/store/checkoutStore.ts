import { create } from "zustand";
import { CheckoutApiService } from "@/services/checkoutApi";
import { PayoneerSDKUtils } from "@/features/embeddedCheckout/utils/payoneerSdk";
import { useConfigurationStore } from "./configurationStore";
import {
  buildListSessionUpdates,
  extractSdkVersionFromMetaInfo,
} from "@/features/embeddedCheckout/utils/checkoutUtils";
import { persist, createJSONStorage } from "zustand/middleware";

import type {
  CheckoutInstance,
  DropInComponent,
  ListSessionResponse,
  PaymentMethod,
  ListSessionRequest,
  CheckoutInstanceConfig,
  ComponentListDiff,
} from "@/features/embeddedCheckout/types/checkout";
import hashStorage from "@/utils/urlHashStorage";
import {
  detectLocalServers,
  type ServerStatus,
} from "@/utils/localServerDetection";
import type { LocalModeConfig } from "@/features/embeddedCheckout/constants/checkout";

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
  version: string; // New: SDK version
  preload: string[]; // New: Preload array
  isEnvChanging: boolean; // New: Flag to prevent updates during env change
  refetchListBeforeCharge: boolean; // New: Toggle for refetching list before charge
  manualListId: string | null; // New: Optional manual list ID to override generated session

  // Local development mode - automatically uses local servers when available
  localServersStatus: ServerStatus; // Status of local servers
  isDetectingServers: boolean; // Loading state for server detection

  // componentListChange diff
  componentListDiff: ComponentListDiff | null;
  hasChangedComponents: boolean;

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
  setManualListId: (listId: string | null) => void; // New action to set manual list ID
  setComponenetsDiff: (
    checkout: CheckoutInstance,
    diff: ComponentListDiff | null
  ) => void;
  detectLocalServers: () => Promise<void>;
}

export const useCheckoutStore = create<CheckoutState>()(
  persist(
    (set, get) => ({
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
      version: "",
      preload: ["stripe:cards"], // Initialize preload
      isEnvChanging: false, // Initialize flag
      refetchListBeforeCharge: false, // Initialize refetch toggle
      manualListId: null, // Initialize manual list ID

      localServersStatus: {
        checkoutWeb: false,
        checkoutWebStripe: false,
      },
      isDetectingServers: false,

      componentListDiff: null,
      hasChangedComponents: false,

      activeNetwork: "",
      availableMethods: [],
      dropIns: [],
      isSubmitting: false,
      areComponentsMounted: false,

      // Actions
      initSession: async () => {
        const { isSessionInitialized, manualListId } = get();
        if (isSessionInitialized) return;
        set({ sessionLoading: true });
        try {
          // If manual list ID is provided, use it instead of generating a session
          if (manualListId) {
            // Create a minimal list session data object with the manual ID
            const manualSessionData: ListSessionResponse = {
              id: manualListId,
              transactionId: "", // Empty string as we don't have this from manual input
              url: "", // Empty string as we don't have this from manual input
            };
            set({
              listSessionData: manualSessionData,
              sessionError: null,
              isSessionInitialized: true,
            });
          } else {
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
          }
        } catch (err) {
          const errorMessage =
            err instanceof Error
              ? err.message
              : "Failed to generate list session";
          set({ sessionError: errorMessage });
          console.error("Failed to generate list session:", err);
        } finally {
          set({ sessionLoading: false });
        }
      },

      initCheckout: async (listSessionId, navigate) => {
        const { isCheckoutInitialized, localServersStatus } = get();
        if (!listSessionId || isCheckoutInitialized) return;
        set({ checkoutLoading: true });
        try {
          // Load callback configurations from callback store
          const { useCallbackStore } = await import("./callbackStore");
          const callbackConfigs = useCallbackStore
            .getState()
            .prepareSDKCallbacks();

          // Prepare local mode config - automatically use local servers if available
          const localModeConfig: LocalModeConfig = {
            enabled: true, // Always enabled, will use local if available
            checkoutWebAvailable: localServersStatus.checkoutWeb,
            checkoutWebStripeAvailable: localServersStatus.checkoutWebStripe,
          };

          const checkoutInstance = await PayoneerSDKUtils.initCheckout(
            listSessionId,
            get().env,
            get().preload,
            get().refetchListBeforeCharge,
            callbackConfigs,
            localModeConfig
          );

          const metaInfo = await PayoneerSDKUtils.getCheckoutMetaInfo(
            get().env,
            localModeConfig
          );
          const version = extractSdkVersionFromMetaInfo(metaInfo);

          set({
            checkout: checkoutInstance,
            checkoutError: null,
            isCheckoutInitialized: true,
            version,
          });
        } catch (err) {
          const errorMessage =
            err instanceof Error
              ? err.message
              : "Failed to initialize checkout";
          set({ checkoutError: errorMessage });
          console.error("Failed to initialize checkout:", err);
          navigate("/failed");
        } finally {
          set({ checkoutLoading: false });
        }
      },

      updateListSession: async (updates, listSessionId, transactionId) => {
        const { checkout, isEnvChanging } = get();
        if (!checkout || !listSessionId || !transactionId || isEnvChanging)
          return;
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

        await checkout.updateLongId(listSessionId);
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

      updateSdkConfig: async (
        partialConfig: Partial<CheckoutInstanceConfig>
      ) => {
        const { checkout } = get();
        if (!checkout) {
          set({ checkoutError: "Checkout not initialized" });
          return;
        }

        set({
          checkoutLoading: true,
          checkoutError: null,
        });

        try {
          // Update settings in store
          if (partialConfig.preload) {
            set({ preload: partialConfig.preload });
          }

          if (partialConfig.refetchListBeforeCharge !== undefined) {
            set({
              refetchListBeforeCharge: partialConfig.refetchListBeforeCharge,
            });
          }

          // For environment changes, we need a new session (unless manual list ID is set)
          if (partialConfig.env) {
            const { manualListId } = get();
            if (manualListId) {
              // If manual list ID is set, use it instead of generating a new session
              const manualSessionData: ListSessionResponse = {
                id: manualListId,
                transactionId: "",
                url: "",
              };
              set({ listSessionData: manualSessionData });
            } else {
              const configState = useConfigurationStore.getState();
              const newUpdates = buildListSessionUpdates(
                configState.merchantCart,
                configState.billingAddress,
                configState.shippingAddress,
                configState.sameAddress,
                partialConfig.env
              );

              const newListSession =
                await CheckoutApiService.generateListSession(
                  newUpdates,
                  partialConfig.env
                );
              set({ listSessionData: newListSession });
            }
            set({ env: partialConfig.env });
          }

          // Recreate checkout instance with new configuration
          await get().recreateCheckout();

          set({ checkoutError: null });
          console.log("✅ SDK configuration updated successfully");
        } catch (err) {
          const errorMessage =
            err instanceof Error ? err.message : "Failed to update configuration";
          set({ checkoutError: errorMessage });
          console.error("Failed to update configuration:", err);
        } finally {
          set({ checkoutLoading: false });
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
          dropIns.forEach((dropIn: DropInComponent) => {
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
            throw new Error(
              "No list session available for checkout recreation"
            );
          }

          // Step 3: Read current callback configuration from callback store
          const { useCallbackStore } = await import("./callbackStore");
          const callbackConfig = useCallbackStore
            .getState()
            .prepareSDKCallbacks();

          // Step 4: Read current environment and preload settings from checkout store
          const currentEnv = get().env;
          const currentPreload = get().preload;
          const currentRefetch = get().refetchListBeforeCharge;
          const localServersStatus = get().localServersStatus;

          // Prepare local mode config - automatically use local servers if available
          const localModeConfig: LocalModeConfig = {
            enabled: true, // Always enabled, will use local if available
            checkoutWebAvailable: localServersStatus.checkoutWeb,
            checkoutWebStripeAvailable: localServersStatus.checkoutWebStripe,
          };

          // Step 5: Create new checkout instance with current settings
          const newCheckoutInstance = await PayoneerSDKUtils.initCheckout(
            sessionIdToUse,
            currentEnv,
            currentPreload,
            currentRefetch,
            callbackConfig,
            localModeConfig
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
      setComponenetsDiff: (
        checkout: CheckoutInstance,
        componentListDiff: ComponentListDiff | null
      ) => {
        const available = checkout.availableDropInComponents();

        useCheckoutStore.getState().setAvailableMethods(available);

        set({
          componentListDiff,
          checkout,
          hasChangedComponents: true,
        });
      },

      setManualListId: (listId: string | null) => {
        set({ manualListId: listId });
        // Reset session and checkout initialization so they can be re-initialized with the new list ID
        set({
          isSessionInitialized: false,
          listSessionData: null,
          isCheckoutInitialized: false,
          checkout: null,
        });
      },

      // Local mode actions
      detectLocalServers: async () => {
        set({ isDetectingServers: true });
        try {
          const status = await detectLocalServers();
          const previousStatus = get().localServersStatus;
          set({ localServersStatus: status });

          // Log status changes
          if (
            status.checkoutWeb !== previousStatus.checkoutWeb ||
            status.checkoutWebStripe !== previousStatus.checkoutWebStripe
          ) {
            console.log("📡 Local servers detected:", status);

            // Recreate checkout if already initialized to pick up new servers
            if (get().isCheckoutInitialized) {
              console.log(
                "🔄 Recreating checkout with updated server status..."
              );
              await get().recreateCheckout();
            }
          }
        } catch (error) {
          console.error("Failed to detect local servers:", error);
        } finally {
          set({ isDetectingServers: false });
        }
      },
    }),
    {
      name: "checkout-storage",
      storage: createJSONStorage(() => hashStorage),
      partialize: (state) => ({
        env: state.env,
        refetchListBeforeCharge: state.refetchListBeforeCharge,
      }),
    }
  )
);
