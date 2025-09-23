import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCheckoutStore } from "../store/checkoutStore";
import { useConfigurationStore } from "../store/configuration";
import { buildListSessionUpdates } from "../utils/checkoutUtils";

import type { ListSessionResponse } from "../types/checkout";

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
  const { merchantCart, billingAddress, shippingAddress, sameAddress } =
    useConfigurationStore();
  const listSessionId = listSessionData?.id || "";
  const transactionId = listSessionData?.transactionId || "";

  useEffect(() => {
    if (listSessionId) {
      initCheckout(listSessionId, navigate);
    }
  }, [listSessionId, navigate, initCheckout]);

  useEffect(() => {
    const updates = buildListSessionUpdates(
      merchantCart,
      billingAddress,
      shippingAddress,
      sameAddress
    );
    updateListSession(updates, listSessionId, transactionId);
  }, [
    merchantCart,
    billingAddress,
    shippingAddress,
    sameAddress,
    listSessionId,
    transactionId,
    updateListSession,
  ]);

  return { checkout, loading: checkoutLoading, error: checkoutError };
};
