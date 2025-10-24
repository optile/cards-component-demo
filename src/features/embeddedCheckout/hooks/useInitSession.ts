import { useEffect, useRef } from "react";
import { useCheckoutStore } from "../store/checkoutStore";

export const useInitSession = () => {
  const { listSessionData, sessionLoading, sessionError, initSession } =
    useCheckoutStore();
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!initializedRef.current) {
      initSession();
      initializedRef.current = true;
    }
  }, [initSession]);

  return { listSessionData, loading: sessionLoading, error: sessionError };
};
