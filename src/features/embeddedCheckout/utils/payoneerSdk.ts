import {
  getApiEndpoints,
  type LocalModeConfig,
} from "@/features/embeddedCheckout/constants/checkout";
import { useCheckoutStore } from "@/features/embeddedCheckout/store/checkoutStore";
import type {
  CheckoutInstance,
  CheckoutWebMetaInfo,
  ComponentListDiff,
} from "@/features/embeddedCheckout/types/checkout";

export class PayoneerSDKUtils {
  private static isFetchOverrideInstalled = false;
  private static currentLocalModeConfig: LocalModeConfig | undefined;

  private static isSDKLoaded(): boolean {
    return (
      typeof window !== "undefined" &&
      typeof window.Payoneer !== "undefined" &&
      typeof window.Payoneer.CheckoutWeb === "function"
    );
  }

  /**
   * Install fetch override to redirect stripe meta-info requests to local server
   * This must be called BEFORE loading the SDK to ensure it intercepts SDK's internal fetch calls
   * The override checks the current config dynamically to support mode switching
   */
  private static installFetchOverride(localModeConfig?: LocalModeConfig): void {
    // Store the current config
    this.currentLocalModeConfig = localModeConfig;

    // Only install once - the override will check config dynamically
    if (this.isFetchOverrideInstalled) {
      return;
    }

    if (typeof window === "undefined") {
      return;
    }

    // Dev-only tooling: the `/opg-proxy` route and the local-SDK proxies only exist on the Vite dev
    // server, so a production build has nothing to rewrite to. Skip installing the global fetch
    // override entirely there — keeps it off window.fetch and out of the shipped bundle's hot path.
    if (!import.meta.env.DEV) {
      return;
    }

    console.log(
      "🔧 Installing dynamic fetch override for local stripe support"
    );

    const originalFetch = window.fetch.bind(window);
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;

    window.fetch = function (url: RequestInfo | URL, options?: RequestInit) {
      const urlString = typeof url === "string" ? url : url.toString();

      // The Express Checkout Element calls the OPG `GET /pci/v1/express` (and its `.../charge` POST)
      // directly on the api.<env>.oscato.com host, which serves no CORS headers — the browser blocks
      // it from https://localhost. Rewrite those cross-origin OPG express calls to the same-origin
      // `/opg-proxy` dev route (Vite proxies it to the OPG host). Same-origin
      // requests (already proxied) are left untouched. The LIST session (`/checkout/session`) is a
      // different path and is not rewritten.
      try {
        const parsed = new URL(urlString, window.location.origin);
        // Restrict the rewrite to the OPG host family so the shim can never reroute an arbitrary
        // cross-origin request. `includes` (not an exact match) is intentional: it catches both the
        // `GET /pci/v1/express` and its `.../charge` POST, which live under the same base path.
        if (
          parsed.hostname.endsWith(".oscato.com") &&
          parsed.pathname.includes("/pci/v1/express") &&
          parsed.origin !== window.location.origin
        ) {
          const proxied = `${window.location.origin}/opg-proxy${parsed.pathname}${parsed.search}`;
          console.log("🔀 Routing OPG express call through /opg-proxy:", parsed.href, "→", proxied);
          return originalFetch(proxied, options);
        }
      } catch {
        // Non-absolute / unparseable URL — fall through to the normal handling below.
      }

      // Dynamically check if we should use local stripe
      const useLocalStripe =
        self.currentLocalModeConfig?.enabled &&
        self.currentLocalModeConfig?.checkoutWebStripeAvailable;

      if (useLocalStripe) {
        // Intercept stripe meta-info requests and redirect to local
        if (
          urlString.includes(
            "/web/libraries/checkout-web-stripe/meta-info.json"
          )
        ) {
          console.log(
            "🔀 Redirecting stripe meta-info to local:",
            urlString,
            "→",
            "/local-checkout-web-stripe/meta-info.json"
          );
          return originalFetch(
            "/local-checkout-web-stripe/meta-info.json",
            options
          );
        }

        // Also intercept any direct requests to stripe loader
        if (urlString.includes("payoneer-stripe-loader.js")) {
          const localUrl = urlString.replace(
            /https:\/\/resources\.[^/]+\.oscato\.com\/web\/libraries\/checkout-web-stripe/,
            "/local-checkout-web-stripe"
          );
          console.log(
            "🔀 Redirecting stripe loader to local:",
            urlString,
            "→",
            localUrl
          );
          return originalFetch(localUrl, options);
        }
      }

      return originalFetch(url, options);
    };

    this.isFetchOverrideInstalled = true;
  }

  static async loadCheckoutWeb(
    env: string,
    localModeConfig?: LocalModeConfig
  ): Promise<boolean> {
    return new Promise((resolve) => {
      // Always update config (even if SDK is already loaded) to support dynamic switching
      this.installFetchOverride(localModeConfig);

      // Check if SDK is already loaded
      if (this.isSDKLoaded()) {
        resolve(true);
        return;
      }

      // SDK not loaded yet - load the script

      // Load SDK script
      const API_ENDPOINTS = getApiEndpoints(env, localModeConfig);
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
    callbacks?: Record<string, unknown>, // Optional callbacks for advanced configuration
    localModeConfig?: LocalModeConfig
  ): Promise<CheckoutInstance> {
    const isLoaded = await this.loadCheckoutWeb(env, localModeConfig);

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

  static getCheckoutMetaInfo(
    env: string,
    localModeConfig?: LocalModeConfig
  ): Promise<CheckoutWebMetaInfo> {
    return new Promise((resolve, reject) => {
      const API_ENDPOINTS = getApiEndpoints(env, localModeConfig);
      fetch(API_ENDPOINTS.META_INFO)
        .then((response) => {
          if (!response.ok) {
            throw new Error(
              `Failed to fetch meta info: ${response.status} ${response.statusText}`
            );
          }
          return response.json();
        })
        .then((data) => resolve(data))
        .catch((error) => reject(error));
    });
  }
}
