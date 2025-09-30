import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCheckoutStore } from "../store/checkoutStore";

import type { ListSessionResponse } from "../types/checkout";

export const usePayoneerCheckout = (
  listSessionData: ListSessionResponse | null
) => {
  const navigate = useNavigate();
  const { checkout, checkoutLoading, checkoutError, initCheckout } =
    useCheckoutStore();
  const listSessionId = listSessionData?.id || "";

  useEffect(() => {
    if (listSessionId) {
      initCheckout(listSessionId, navigate);
    }
  }, [listSessionId, navigate, initCheckout]);

  return { checkout, loading: checkoutLoading, error: checkoutError };
};
