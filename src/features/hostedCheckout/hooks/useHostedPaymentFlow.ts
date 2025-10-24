import { useState } from "react";
import { CheckoutApiService } from "@/services/checkoutApi";
import { buildListSessionUpdates } from "@/features/embeddedCheckout/utils/checkoutUtils";
import { INTEGRATION_TYPE } from "@/features/embeddedCheckout/types/checkout";
import { getHostedPaymentPageUrl } from "@/features/hostedCheckout/constants/hostedPaymentConfig";
import type { ListSessionRequest } from "@/features/embeddedCheckout/types/checkout";
import type { HostedPaymentFlowState } from "@/features/hostedCheckout/types/hostedPayment";
import type {
  MerchantCart,
  BillingAddress,
  ShippingAddress,
} from "../../../types/merchant";

export const useHostedPaymentFlow = () => {
  const [state, setState] = useState<HostedPaymentFlowState>({
    isLoading: false,
    error: null,
    success: false,
  });

  const initiateHostedPayment = async (
    merchantCart: MerchantCart,
    billingAddress: BillingAddress,
    shippingAddress: ShippingAddress,
    sameAddress: boolean,
    env: string
  ) => {
    setState({ isLoading: true, error: null, success: false });

    try {
      // Step 1: Build the list session request with hosted-specific config
      const preparedListRequest = buildListSessionUpdates(
        merchantCart,
        billingAddress,
        shippingAddress,
        sameAddress,
        env,
        INTEGRATION_TYPE.HOSTED
      );

      // Step 2: Create the list session on the server
      const listSessionResponse = await CheckoutApiService.generateListSession(
        preparedListRequest as ListSessionRequest,
        env
      );

      if (!listSessionResponse.id) {
        throw new Error("No list session ID returned from server");
      }

      // Step 3: Construct the hosted payment page URL
      const hostedPageUrl = getHostedPaymentPageUrl(
        env,
        listSessionResponse.id
      );

      // Step 4: Redirect user to the hosted payment page
      setState({ isLoading: false, error: null, success: true });
      window.location.href = hostedPageUrl;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      console.error("Error initiating hosted payment:", error);
      setState({
        isLoading: false,
        error: errorMessage,
        success: false,
      });
    }
  };

  const clearError = () => {
    setState((prev) => ({ ...prev, error: null }));
  };

  return {
    ...state,
    initiateHostedPayment,
    clearError,
  };
};
