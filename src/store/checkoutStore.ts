import { create } from "zustand";
import { CheckoutApiService } from "../services/checkoutApi";
import { PayoneerSDKUtils } from "../utils/payoneerSdk";
import { useConfigurationStore } from "../store/configuration";
import { buildListSessionUpdates } from "../utils/checkoutUtils";
import type {
  CheckoutInstance,
  DropInComponent,
  ListSessionResponse,
  PaymentMethod,
  ListSessionRequest,
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
  updateEnvironment: (newEnv: string) => Promise<void>; // New action
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
      const checkoutInstance = await PayoneerSDKUtils.initCheckout(
        listSessionId,
        get().env,
        get().preload
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
    checkout.update({});
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

  updateEnvironment: async (newEnv: string) => {
    const { checkout } = get();
    if (!checkout) {
      set({ checkoutError: "Checkout not initialized" });
      return;
    }

    set({
      checkoutLoading: true,
      checkoutError: null,
      env: newEnv,
      isEnvChanging: true,
    }); // Set flag
    try {
      // Build new list session updates with new env
      const configState = useConfigurationStore.getState();
      const newUpdates = buildListSessionUpdates(
        configState.merchantCart,
        configState.billingAddress,
        configState.shippingAddress,
        configState.sameAddress,
        newEnv
      );

      // Generate new list session
      const newListSessionResponse =
        await CheckoutApiService.generateListSession(newUpdates, newEnv);
      set({ listSessionData: newListSessionResponse });

      // Update SDK with new env and longId
      await checkout.update({
        env: newEnv,
        longId: newListSessionResponse.id,
      });

      console.log(
        "Environment updated to:",
        newEnv,
        "with new list session:",
        newListSessionResponse.id
      );
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to update environment";
      set({ checkoutError: errorMessage });
      console.error("Failed to update environment:", err);
    } finally {
      set({ checkoutLoading: false, isEnvChanging: false }); // Reset flag
    }
  },
}));
