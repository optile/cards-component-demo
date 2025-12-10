/**
 * Configuration for local development servers
 */
export const LOCAL_SERVERS = {
  CHECKOUT_WEB: {
    url: "http://localhost:8700",
    healthCheck: "/build/umd/checkout-web.js", // Served from public/build/umd/
    metaInfo: "/build/meta-info.json",
  },
  CHECKOUT_WEB_STRIPE: {
    url: "http://localhost:8991",
    healthCheck: "/payoneer-stripe.js",
    metaInfo: "/meta-info.json",
  },
} as const;

export interface ServerStatus {
  checkoutWeb: boolean;
  checkoutWebStripe: boolean;
}

/**
 * Check if a local server is running by attempting to fetch a resource
 */
async function checkServer(url: string, path: string): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 second timeout

    await fetch(`${url}${path}`, {
      method: "HEAD",
      signal: controller.signal,
      mode: "no-cors", // Allow requests to local servers without CORS
    });

    clearTimeout(timeoutId);

    // With no-cors mode, we can't read the response, but if it doesn't throw, server is up
    return true;
  } catch (_error) {
    // Server is not running or request failed
    return false;
  }
}

/**
 * Detect which local servers are currently running
 */
export async function detectLocalServers(): Promise<ServerStatus> {
  const [checkoutWeb, checkoutWebStripe] = await Promise.all([
    checkServer(
      LOCAL_SERVERS.CHECKOUT_WEB.url,
      LOCAL_SERVERS.CHECKOUT_WEB.healthCheck
    ),
    checkServer(
      LOCAL_SERVERS.CHECKOUT_WEB_STRIPE.url,
      LOCAL_SERVERS.CHECKOUT_WEB_STRIPE.healthCheck
    ),
  ]);

  return {
    checkoutWeb,
    checkoutWebStripe,
  };
}

/**
 * Get the base URL for checkout-web based on local mode
 */
export function getCheckoutWebBaseUrl(
  useLocal: boolean,
  serverAvailable: boolean
): string {
  return useLocal && serverAvailable ? LOCAL_SERVERS.CHECKOUT_WEB.url : "";
}

/**
 * Get the base URL for checkout-web-stripe based on local mode
 */
export function getCheckoutWebStripeBaseUrl(
  useLocal: boolean,
  serverAvailable: boolean
): string {
  return useLocal && serverAvailable
    ? LOCAL_SERVERS.CHECKOUT_WEB_STRIPE.url
    : "";
}
