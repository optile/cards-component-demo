import { create } from "zustand";
import { CheckoutApiService } from "../services/checkoutApi";
import { PayoneerSDKUtils } from "../utils/payoneerSdk";
import { DEFAULT_LIST_REQUEST } from "../constants/checkout";
import type {
  CheckoutInstance,
  DropInComponent,
  ListSessionResponse,
  PaymentMethod,
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
    amount: number,
    listSessionId: string,
    transactionId: string
  ) => Promise<void>;
  setAvailableMethods: (methods: PaymentMethod[]) => void;
  setActiveNetwork: (network: string) => void;
  mountComponents: (
    checkout: CheckoutInstance | null,
    componentRefs: { [key: string]: HTMLDivElement | null }
  ) => void;
  handlePayment: () => Promise<void>;
  updatePayButton: (payButtonType: string) => void;
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
      const response = await CheckoutApiService.generateListSession();
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
        listSessionId
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

  updateListSession: async (amount, listSessionId, transactionId) => {
    const { checkout } = get();
    if (!checkout || !listSessionId || !transactionId) return;
    const updatedListSessionObject = {
      ...DEFAULT_LIST_REQUEST,
      amount,
      transactionId,
    };
    const response = await CheckoutApiService.updateListSession(
      listSessionId,
      updatedListSessionObject
    );
    if (!response.ok) {
      console.error("Failed to update list session:", response.statusText);
      return;
    }
    // @ts-expect-error - This will be resolved through https://optile.atlassian.net/browse/PCPAY-4175
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

  mountComponents: (checkout, componentRefs) => {
    const { availableMethods, areComponentsMounted } = get();
    if (!checkout || availableMethods.length === 0 || areComponentsMounted)
      return;
    const allRefsAreSet = availableMethods.every(
      (method) => componentRefs[method.name]
    );
    if (allRefsAreSet) {
      // Unmount previous
      get().dropIns.forEach((dropIn) => dropIn.unmount());
      const newDropIns: DropInComponent[] = [];
      availableMethods.forEach((method) => {
        const container = componentRefs[method.name];
        if (container) {
          const component = checkout
            .dropIn(method.name, { hidePaymentButton: false })
            .mount(container);
          newDropIns.push(component);
        }
      });
      set({ dropIns: newDropIns, areComponentsMounted: true });
    }
  },

  handlePayment: async () => {
    const { isSubmitting, checkout, dropIns, availableMethods, activeNetwork } =
      get();
    if (isSubmitting || !checkout) return;
    set({ isSubmitting: true });
    const activeDropIn = dropIns.find(
      (_, index) => availableMethods[index].name === activeNetwork
    );
    if (activeDropIn) {
      await activeDropIn.pay();
    }
    set({ isSubmitting: false });
  },

  updatePayButton: (payButtonType) => {
    const isPayButtonHidden = payButtonType === "custom";
    get().dropIns.forEach((component) => {
      // @ts-expect-error - The hidePaymentButton method exists on the instance but not in the current type
      component.element.hidePaymentButton(isPayButtonHidden);
    });
  },
}));
