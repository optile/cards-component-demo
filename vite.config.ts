import { defineConfig, loadEnv } from "vite";
import basicSsl from "@vitejs/plugin-basic-ssl";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { localMetaInfoPlugin } from "./src/vite-plugins/localMetaInfoPlugin";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const useHttps = env.EXPRESS_HTTPS === "true";
  const opgTarget =
    env.OPG_PROXY_TARGET || "https://api.checkout.integration.oscato.com";

  return {
    plugins: [
      react(),
      tailwindcss(),
      localMetaInfoPlugin(),
      ...(useHttps ? [basicSsl()] : []),
    ],
    resolve: {
      alias: {
        "@": "/src",
      },
    },
    server: {
      port: 3000,
      proxy: {
        // Proxy checkout-web resources when in local mode
        '/local-checkout-web': {
          target: 'http://localhost:8700',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/local-checkout-web/, ''),
        },
        // Proxy checkout-web-stripe resources when in local mode
        '/local-checkout-web-stripe': {
          target: 'http://localhost:8991',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/local-checkout-web-stripe/, ''),
        },
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
