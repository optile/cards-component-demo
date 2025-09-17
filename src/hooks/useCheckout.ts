import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useCheckoutStore } from "../store/checkoutStore";
import { useConfigurationStore } from "../store/configuration";

import type { CheckoutInstance, ListSessionResponse } from "../types/checkout";

export const useCheckoutSession = () => {
  const { listSessionData, sessionLoading, sessionError, initSession } =
    useCheckoutStore();

  useEffect(() => {
    initSession();
  }, [initSession]);

  return { listSessionData, loading: sessionLoading, error: sessionError };
};

export const usePayoneerCheckout = (
  listSessionData: ListSessionResponse | null
) => {
  const navigate = useNavigate();
  const {
    checkout,
    checkoutLoading,
    checkoutError,
    initCheckout,
    updateListSession,
  } = useCheckoutStore();
  const { amount } = useConfigurationStore();
  const listSessionId = listSessionData?.id || "";
  const transactionId = listSessionData?.transactionId || "";

  useEffect(() => {
    initCheckout(listSessionId, navigate);
  }, [listSessionId, navigate, initCheckout]);

  useEffect(() => {
    updateListSession(amount, listSessionId, transactionId);
  }, [amount, listSessionId, transactionId, updateListSession]);

  return { checkout, loading: checkoutLoading, error: checkoutError };
};

export const usePaymentMethods = (checkout: CheckoutInstance | null) => {
  const {
    activeNetwork,
    setActiveNetwork,
    availableMethods,
    setAvailableMethods,
    mountComponents,
    handlePayment,
    updatePayButton,
    isSubmitting,
  } = useCheckoutStore();
  const componentRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const { payButtonType } = useConfigurationStore();

  useEffect(() => {
    if (!checkout) return;

    const available = checkout.availableDropInComponents();
    setAvailableMethods(available);
  }, [checkout, setAvailableMethods]);

  useEffect(() => {
    updatePayButton(payButtonType);
  }, [payButtonType, updatePayButton]);

  useEffect(() => {
    mountComponents(checkout, componentRefs.current);
  }, [checkout, availableMethods, mountComponents]);

  return {
    activeNetwork,
    setActiveNetwork,
    componentRefs,
    handlePayment,
    availableMethods,
    isSubmitting,
  };
};
