import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckoutApiService } from "../services/checkoutApi";
import { useConfigurationStore } from "../store/configuration";
import { DEFAULT_LIST_REQUEST } from "../constants/checkout";

import type {
  CheckoutInstance,
  DropInComponent,
  ListSessionResponse,
  PaymentMethod,
} from "../types/checkout";
import { PayoneerSDKUtils } from "../utils/payoneerSdk";

export const useCheckoutSession = () => {
  const [listSessionData, setListSessionData] =
    useState<ListSessionResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const isSessionInitialized = useRef(false);

  useEffect(() => {
    if (isSessionInitialized.current) return;

    const initSession = async () => {
      try {
        setLoading(true);
        const response = await CheckoutApiService.generateListSession();
        setListSessionData(response);
        setError(null);
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Failed to generate list session";
        setError(errorMessage);
        console.error("Failed to generate list session:", err);
      } finally {
        setLoading(false);
      }
    };

    isSessionInitialized.current = true;
    initSession();
  }, []);

  return { listSessionData, loading, error };
};

export const usePayoneerCheckout = (
  listSessionData: ListSessionResponse | null
) => {
  const navigate = useNavigate();
  const [checkout, setCheckout] = useState<CheckoutInstance | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { amount } = useConfigurationStore();
  const listSessionId = listSessionData?.id || "";
  const transactionId = listSessionData?.transactionId || "";
  const isCheckoutInitialized = useRef(false);

  useEffect(() => {
    if (!listSessionId || isCheckoutInitialized.current) return;

    const initCheckout = async () => {
      try {
        setLoading(true);
        const checkoutInstance = await PayoneerSDKUtils.initCheckout(
          listSessionId
        );
        setCheckout(checkoutInstance);
        setError(null);
        isCheckoutInitialized.current = true;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to initialize checkout";
        setError(errorMessage);
        console.error("Failed to initialize checkout:", err);
        navigate("/failed");
      } finally {
        setLoading(false);
      }
    };

    initCheckout();
  }, [listSessionId, navigate, transactionId]);

  // TODO - this will be handler for changing all the merchant store data
  // https://optile.atlassian.net/browse/PCPAY-4175
  useEffect(() => {
    if (
      !checkout ||
      !listSessionId ||
      !transactionId ||
      !isCheckoutInitialized.current
    )
      return;

    const updateListSession = async () => {
      const updatedListSessionObject = {
        ...DEFAULT_LIST_REQUEST,
        amount,
        transactionId,
      };

      const response = await CheckoutApiService.updateListSession(
        listSessionId,
        {
          ...updatedListSessionObject,
        }
      );

      if (!response.ok) {
        console.error("Failed to update list session:", response.statusText);
        return;
      }

      // @ts-expect-error - This will be resolved trough https://optile.atlassian.net/browse/PCPAY-4175
      checkout.update({});
    };

    updateListSession();
  }, [amount, checkout, listSessionId, transactionId]);

  return { checkout, loading, error };
};

export const usePaymentMethods = (checkout: CheckoutInstance | null) => {
  const [activeNetwork, setActiveNetwork] = useState<string>("");
  const componentRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const dropInsRef = useRef<DropInComponent[]>([]);
  const [availableMethods, setAvailableMethods] = useState<PaymentMethod[]>([]);
  const areComponentsMounted = useRef(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { payButtonType } = useConfigurationStore();

  useEffect(() => {
    if (!checkout) return;

    const available = checkout.availableDropInComponents();
    setAvailableMethods(available);

    if (available.length > 0 && !activeNetwork) {
      setActiveNetwork(available[0].name);
    }
  }, [checkout, activeNetwork]);

  useEffect(() => {
    const isPayButtonHidden = payButtonType === "custom";

    // Update hidePaymentButton for all mounted components
    dropInsRef.current.forEach((component) => {
      // @ts-expect-error - The hidePaymentButton method exists on the instance but not in the current type
      component.element.hidePaymentButton(isPayButtonHidden);
    });
  }, [payButtonType]);

  useEffect(() => {
    if (
      !checkout ||
      availableMethods.length === 0 ||
      areComponentsMounted.current
    ) {
      return;
    }

    // Check if all container elements are rendered and available in the refs
    const allRefsAreSet = availableMethods.every(
      (method) => componentRefs.current[method.name]
    );

    if (allRefsAreSet) {
      // Unmount any previous instances to be safe
      dropInsRef.current.forEach((dropIn) => dropIn.unmount());
      dropInsRef.current = [];

      // Mount all available components
      availableMethods.forEach((method) => {
        const container = componentRefs.current[method.name];
        if (container) {
          const component = checkout
            .dropIn(method.name, { hidePaymentButton: false })
            .mount(container);
          dropInsRef.current.push(component);
        }
      });

      // Mark components as mounted to prevent this effect from running again
      areComponentsMounted.current = true;
    }

    // This effect should run when availableMethods are populated and the refs are set.
    // The componentRefs object itself doesn't trigger re-renders, so we depend on availableMethods.
  }, [checkout, availableMethods]);

  const handlePayment = async () => {
    if (isSubmitting) return; // Prevent multiple submissions
    setIsSubmitting(true);
    if (checkout) {
      // get current active drop-in component
      const activeDropIn = dropInsRef.current.find((_, index) => {
        return availableMethods[index].name === activeNetwork;
      });
      if (activeDropIn) {
        await activeDropIn.pay();
      }
    }
    setIsSubmitting(false);
  };

  return {
    activeNetwork,
    setActiveNetwork,
    componentRefs,
    handlePayment,
    availableMethods,
    isSubmitting,
  };
};
