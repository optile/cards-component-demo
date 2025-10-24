import { getApiEndpoints } from "../constants/checkout";
import { useCheckoutStore } from "../store/checkoutStore";
import type { CheckoutInstance, ComponentListDiff } from "../types/checkout";

export class PayoneerSDKUtils {
  private static isSDKLoaded(): boolean {
    return (
      typeof window !== "undefined" &&
      typeof window.Payoneer !== "undefined" &&
      typeof window.Payoneer.CheckoutWeb === "function"
    );
  }

  static async loadCheckoutWeb(env: string): Promise<boolean> {
    return new Promise((resolve) => {
      // Check if SDK is already loaded
      if (this.isSDKLoaded()) {
        resolve(true);
        return;
      }

      // Load SDK script
      const API_ENDPOINTS = getApiEndpoints(env);
      const script = document.createElement("script");
      script.src = API_ENDPOINTS.SDK_URL;
      script.async = true;

      script.onload = () => {
        resolve(this.isSDKLoaded());
      };

      script.onerror = () => {
        resolve(false);
      };

      document.body.appendChild(script);
    });
  }

  static async initCheckout(
    longId: string,
    env: string,
    preload: string[],
    refetchListBeforeCharge: boolean,
    callbacks?: Record<string, unknown> // Optional callbacks for advanced configuration
  ): Promise<CheckoutInstance> {
    const isLoaded = await this.loadCheckoutWeb(env);

    if (!isLoaded) {
      throw new Error("Failed to load Checkout Web SDK");
    }

    if (!window.Payoneer || !window.Payoneer.CheckoutWeb) {
      throw new Error("Checkout Web is not available on the window object!");
    }

    // Build configuration object
    const config = {
      longId,
      env,
      refetchListBeforeCharge,
      onComponentListChange: (
        checkout: CheckoutInstance,
        diff: ComponentListDiff
      ) => {
        useCheckoutStore.getState().setComponenetsDiff(checkout, diff);
      },
      preload: [...preload],
    };

    // Add callbacks if provided
    if (callbacks) {
      Object.assign(config, callbacks);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return await window.Payoneer.CheckoutWeb(config as any);
  }
}
