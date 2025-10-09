import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useCheckoutStore } from "../store/checkoutStore";

import type { ListSessionResponse } from "../types/checkout";

export const useInitCheckout = (
  listSessionData: ListSessionResponse | null
) => {
  const navigate = useNavigate();
  const isCheckoutInitialized = useRef(false);
  const { checkout, checkoutLoading, checkoutError, initCheckout } =
    useCheckoutStore();
  const listSessionId = listSessionData?.id || "";

  useEffect(() => {
    if (listSessionId && !isCheckoutInitialized.current) {
      console.log("Initializing checkout with session ID:", listSessionId);
      initCheckout(listSessionId, navigate);
      isCheckoutInitialized.current = true;
    }
  }, [listSessionId, navigate, initCheckout]);

  return { checkout, loading: checkoutLoading, error: checkoutError };
};
