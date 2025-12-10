import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { localMetaInfoPlugin } from "./src/vite-plugins/localMetaInfoPlugin";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), localMetaInfoPlugin()],
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
    },
  },
  base: "/cards-component-demo/",
});
