# Payoneer Cards Component Demo

This project demonstrates how to integrate the Payoneer Checkout Web SDK in both embedded and hosted payment experiences. It comes with a full-featured playground that bootstraps list sessions against Payoneer sandbox endpoints, lets you tweak SDK configuration on the fly, and visualizes the behaviour of the rendered payment components.

## Key Features

* Embedded checkout builder with tabs for SDK base settings, advanced callbacks, cart data, customer data, UI theming, and shareable URLs.
* Hosted checkout flow simulator that walks through environment selection, cart setup, customer address capture, and final review before launching the hosted payment page.
* Session management powered by Zustand that persists configuration in storage and can optionally mirror state into the URL for easy sharing.
* Charge flow event logger and demo card numbers to help debug callback timing and test network-specific payment methods.

## Getting Started

### Prerequisites

* Node.js 18.17 or later (Node 20+ recommended for best tooling support).

* npm 9+ (ships with current Node LTS releases).
* Ability to reach the Payoneer sandbox or integration domains (`*.oscato.com`). Corporate VPN access may be required depending on your network.

### Installation

```bash
npm install
npm run dev
```

The dev server defaults to `http://localhost:5173`. Because the router is configured with the basename `/cards-component-demo`, open `http://localhost:5173/cards-component-demo/` to use the app locally.

### Available Scripts

* `npm run dev` - start the Vite development server with hot module replacement.

* `npm run build` - type-check and bundle the app for production output in `dist/`.
* `npm run preview` - serve the built assets locally to validate the production bundle.
* `npm run lint` - run ESLint across the project.

## Using the Demo

### Flow Selection

The landing page presents two entry points:

* **Embedded Checkout Flow**: renders Payoneer Checkout components directly within the demo and lets you experiment with SDK options.
* **Hosted Checkout Flow**: guides you through preparing a list session before redirecting to the hosted Payoneer payment page.

Use the header navigation to switch flows or return to the chooser.

### Embedded Checkout Builder

* The configuration panel drives the list session payload and SDK initialization. Tabs expose base SDK options (environment, preload list, refetch behaviour), advanced callback wiring, cart items, customer addresses, and UI styling tokens.

* Session data is generated through `CheckoutApiService.generateListSession`, which posts to `https://api.{env}.oscato.com/checkout/session`. The default environment is `sandbox`, with an additional `checkout.integration` division available.
* Payment methods are mounted dynamically based on the list response. The event logger at the bottom captures SDK callbacks, charge flow events, and metadata to help validate integration behaviour.
* Toggle URL sharing to persist both checkout and configuration stores into the location hash, enabling copyable deep links that reproduce the current setup.
* `DemoCardNumbers` surfaces network-specific test PANs that work with the sandbox to simulate successful charges.

### Hosted Checkout Simulator

* A multi-step wizard backed by `useHostedConfigurationStore` collects the same cart and customer information, tailored for the hosted integration path.

* Upon confirmation, the flow builds a hosted-style list request (including callback URLs derived from the running origin), calls the list session endpoint, and finally redirects to `https://resources.{env}.oscato.com/paymentpage/v6/responsive.html`.
* Errors encountered while creating the list session or launching the hosted page surface inline with remediation guidance.

### Observability and Debugging

* `App.tsx` initializes Honeycomb OpenTelemetry instrumentation by default. Update the endpoint or disable the block if you do not need tracing.
* The charge flow event logger is sticky at the bottom of the embedded flow and can be expanded to inspect event payloads.

## Configuration and Environment Notes

* Environment and division mappings are defined in `src/features/embeddedCheckout/constants/checkout.ts`. Add new divisions or override endpoints there if you test against additional Payoneer environments.

* Callback URLs for the hosted experience are derived from the current origin in `src/features/hostedCheckout/constants/hostedPaymentConfig.ts`. Adjust them if you deploy behind a different base path.
* If your network blocks cross-origin requests to Payoneer domains, the list session calls will fail. Use the browser console to inspect errors and confirm connectivity.
* The router `basename` (`/cards-component-demo`) keeps relative paths working when the build is deployed to GitHub Pages or a similar static host that serves assets from a subdirectory. Update the basename in `src/App.tsx` if you deploy at root.

## Local Development Mode

You can test local changes to `checkout-web` and `checkout-web-stripe` in real-time without deploying to remote servers. The app automatically detects local development servers and seamlessly switches between local and CDN sources.

### Quick Start

1. **Start local servers** (optional - run one or both):

   ```bash
   # In checkout-web directory
   npm run dev  # Runs on port 8700

   # In checkout-web-stripe directory
   npm run dev  # Runs on port 8991
   ```

2. **Start this demo app**:

   ```bash
   npm run dev  # Runs on port 3000
   ```

3. **Check local mode status**:
   * Open the demo at `http://localhost:3000/cards-component-demo/`
   * Look for the **Local Development Mode** card (only visible on localhost)
   * Server status indicators show which local servers are detected
   * Click **Refresh Servers** if you start a server after loading the page

### How It Works

* **Auto-detection**: The app checks if local servers are running on ports 8700 and 8991 using health checks
* **Automatic fallback**: If local mode is enabled but servers aren't running, the app falls back to the remote CDN
* **Vite proxy**: Requests to `/local-checkout-web` and `/local-checkout-web-stripe` are proxied to avoid CORS issues
* **Meta-info rewriting**: Script URLs in meta-info.json files are automatically rewritten to point to local proxy paths
* **Mixed mode**: You can run just one local server (e.g., only checkout-web-stripe) while loading the other from CDN

### Troubleshooting

**Local servers not detected?**

* Verify servers are running: `curl http://localhost:8700/build/meta-info.json` and `curl http://localhost:8991/meta-info.json`
* Click the **Refresh Servers** button
* Check browser console for errors

**Changes not reflecting?**

* Hard refresh the browser (Cmd+Shift+R / Ctrl+Shift+R)
* The dev servers auto-rebuild, but browser cache may need clearing

**Stripe components not loading locally?**

* Verify checkout-web-stripe is running on port 8991
* Check Network tab for requests to `/local-checkout-web-stripe/`

## Tech Stack

* React 19 with React Router 7 for routing.
* TypeScript throughout the application.
* Vite 7 for build tooling and local development.
* Tailwind CSS 4 (Vite plugin) for utility-first styling.
* Zustand for state management with persistence helpers.
* Honeycomb OpenTelemetry SDK for client instrumentation.
