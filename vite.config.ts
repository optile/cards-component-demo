import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 3000,
  },
  // build: {
  //   outDir: "docs", // Use default 'dist' for GitHub Actions
  // },
  base: "/cards-component-demo/", // Set base to repository name for GitHub Pages
});
