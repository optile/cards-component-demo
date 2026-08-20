import { defineConfig, loadEnv } from "vite";
import mkcert from "vite-plugin-mkcert";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { localMetaInfoPlugin } from "./src/vite-plugins/localMetaInfoPlugin";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const useHttps = env.EXPRESS_HTTPS === "true";
  // Where the demo's fetch shim reroutes OPG `GET /pci/v1/express` calls (payoneerSdk.ts): the SDK
  // derives that URL from its `env` (checkout.integration), but the express clientId is provisioned in
  // `ramy.integration`, so the shim + this proxy send it there. Override when pointing the demo at a
  // different OPG environment.
  const opgTarget =
    env.OPG_PROXY_TARGET || "https://api.ramy.integration.oscato.com";

  return {
    plugins: [
      react(),
      tailwindcss(),
      localMetaInfoPlugin(),
      // Wallets (Google Pay `canMakePayment`) require a browser-TRUSTED cert on https://localhost —
      // Chrome flags a self-signed cert as "DANGEROUS" and disables the Payment Request API, so the
      // Express Checkout Element renders no wallet button. mkcert issues a locally-trusted cert
      // (installing a local CA on first run), unlike basic-ssl's untrusted self-signed cert.
      ...(useHttps ? [mkcert()] : []),
    ],
    resolve: {
      alias: {
        "@": "/src",
      },
    },
    server: {
      port: 3000,
      proxy: {
        // NOTE: local-SDK asset proxying (/local-checkout-web[-stripe]) is handled by
        // localMetaInfoPlugin's configureServer middleware, which runs before Vite's proxy and
        // rewrites the meta-info script URLs — a plain proxy entry can't do that rewrite.
        // Server-to-server proxy for OPG express calls (browser cannot call the OPG host from https://localhost — no CORS).
        "/opg-proxy": {
          target: opgTarget,
          changeOrigin: true,
          secure: true,
          rewrite: (path) => path.replace(/^\/opg-proxy/, ""),
        },
      },
    },
    base: "/cards-component-demo/",
  };
});
