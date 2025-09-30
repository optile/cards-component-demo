import { useEffect } from "react";
import { useCheckoutStore } from "../store/checkoutStore";
import { useCheckoutUI } from "./useCheckoutUI";

import type { CheckoutInstance } from "../types/checkout";

export const usePaymentMethods = (checkout: CheckoutInstance | null) => {
  const {
    activeNetwork,
    setActiveNetwork,
    availableMethods,
    setAvailableMethods,
    isSubmitting,
  } = useCheckoutStore();
  const { componentRefs, handlePayment } = useCheckoutUI(checkout);

  useEffect(() => {
    if (!checkout) return;

    const available = checkout.availableDropInComponents();
    setAvailableMethods(available);
  }, [checkout, setAvailableMethods]);

  return {
    activeNetwork,
    setActiveNetwork,
    componentRefs,
    handlePayment,
    availableMethods,
    isSubmitting,
  };
};
