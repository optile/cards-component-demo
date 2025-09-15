import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import type {
  CheckoutInstance,
  DropInComponent,
  PaymentMethod,
} from "../types/checkout";
import { CheckoutApiService } from "../services/checkoutApi";
import { PayoneerSDKUtils } from "../utils/payoneerSdk";
import { useConfigurationStore } from "../store/configuration";

export const useCheckoutSession = () => {
  const navigate = useNavigate();
  const [longId, setLongId] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initSession = async () => {
      try {
        setLoading(true);
        const response = await CheckoutApiService.generateListSession();
        setLongId(response.id);
        setError(null);
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Failed to generate list session";
        setError(errorMessage);
        console.error("Failed to generate list session:", err);
        navigate("/failed");
      } finally {
        setLoading(false);
      }
    };

    initSession();
  }, [navigate]);

  return { longId, loading, error };
};

export const usePayoneerCheckout = (longId: string) => {
  const navigate = useNavigate();
  const [checkout, setCheckout] = useState<CheckoutInstance | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!longId) return;

    const initCheckout = async () => {
      try {
        setLoading(true);
        const checkoutInstance = await PayoneerSDKUtils.initCheckout(longId);
        setCheckout(checkoutInstance);
        setError(null);
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
  }, [longId, navigate]);

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
    if (
      !checkout ||
      availableMethods.length === 0
      // areComponentsMounted.current
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
          const isPayButtonHidden = payButtonType === "custom";

          const component = checkout.dropIn(method.name).mount(container);
          // @ts-expect-error - The hidePaymentButton method exists on the instance but not in the current type
          component.element.hidePaymentButton(isPayButtonHidden);
          dropInsRef.current.push(component);
        }
      });

      // Mark components as mounted to prevent this effect from running again
      areComponentsMounted.current = true;
    }

    // This effect should run when availableMethods are populated and the refs are set.
    // The componentRefs object itself doesn't trigger re-renders, so we depend on availableMethods.
  }, [checkout, availableMethods, payButtonType]);

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
