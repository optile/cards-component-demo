# Cards Component Demo Context

## Project Overview

This React and Vite project is an interactive playground for the Payoneer Checkout Web SDK. It has no test framework. Verify changes with `npm run lint`, `npm run build`, and a manual smoke test.

The application has three feature slices: `embeddedCheckout`, `hostedCheckout`, and `expressCheckout`. Express Checkout is demo-only and self-contained.

## Express Checkout

The Express Checkout route is `http://localhost:3000/cards-component-demo/express`.

`dropIn('express')` stamps passthrough attributes only when it first creates the element, then caches the element by key. Calling `dropIn('express')` again on the same `CheckoutInstance` ignores updated properties. The demo avoids this cache on the happy path by creating a fresh `CheckoutInstance` for every relevant change in the single rebuild effect in `useExpressCheckout`. Teardown must always unsubscribe with `off`, call `remove('express')`, and call `destroy()`. Without `destroy()`, the CheckoutWeb element and event bus leak across rebuilds and unmounts.

The `checkout.on('wallets:availability')` handler receives the raw availability object, shaped as `{ available, applePay?, googlePay? }`. It does not receive an `{ event, data }` envelope because checkout-web re-emits `detail.data` on its public bus. Guard the payload shape directly. `destroy()` clears the bus, so every fresh instance must subscribe again.

The change-to-action boundary is intentionally broad. Changes to `env`, `walletMode`, `expressWallets`, `expressOperationType`, `amount`, `currency`, `country`, or `quantity` regenerate both the LIST session and CheckoutWeb. The session is authoritative for the charge, so changing `country` must regenerate the session rather than only re-stamping the element. `clientId` and `locale` are passthrough-only values, but this demo also performs a full rebuild for them to keep teardown race-free.

Never hide the express slot with `display:none`. Collapse unavailable content with `height:0` so the Express Checkout Element can still measure and render.

Express theme tokens are scoped with `[data-flow="express"]`, not `@theme`. The config sheet portals to `document.body` and re-applies `data-flow="express"` so it remains inside the same theme scope.

For local wallet testing, start the app with `EXPRESS_HTTPS=true` and use the `/opg-proxy` development route. Google Pay works on `https://localhost` in Chrome. Apple Pay requires a Stripe-registered HTTPS domain, typically supplied through a tunnel.

`VITE_EXPRESS_CLIENT_ID` is a public initialization parameter, not a secret. The backend validates `clientId` server-side.
