import type { CheckoutInstance } from "../types/checkout";
import { API_ENDPOINTS, CHECKOUT_CONFIG } from "../constants/checkout";

export class PayoneerSDKUtils {
  private static isSDKLoaded(): boolean {
    return (
      typeof window !== "undefined" &&
      typeof window.Payoneer !== "undefined" &&
      typeof window.Payoneer.CheckoutWeb === "function"
    );
  }

  static async loadCheckoutWeb(): Promise<boolean> {
    return new Promise((resolve) => {
      // Check if SDK is already loaded
      if (this.isSDKLoaded()) {
        resolve(true);
        return;
      }

      // Load SDK script
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

  static async initCheckout(longId: string): Promise<CheckoutInstance> {
    const isLoaded = await this.loadCheckoutWeb();

    if (!isLoaded) {
      throw new Error("Failed to load Checkout Web SDK");
    }

    if (!window.Payoneer || !window.Payoneer.CheckoutWeb) {
      throw new Error("Checkout Web is not available on the window object!");
    }

    return await window.Payoneer.CheckoutWeb({
      longId,
      env: CHECKOUT_CONFIG.environment,
      preload: [...CHECKOUT_CONFIG.preload],
    });
  }
}
