# cards-component-demo

This repo is developed inside the SDK workspace, cloned as `projects/cards-component-demo`; the `../../` paths
below resolve there. Read the workspace playbook first: `../../docs/AGENT_PLAYBOOK.md`.

## Role

A React 19 and Vite playground for the Payoneer Checkout Web SDK. It is also the reference integrators copy from, so
it should show the intended SDK usage. Three feature slices: `embeddedCheckout`, `hostedCheckout`, and
`expressCheckout`.

There is no test framework. Verify with `npm run lint`, `npm run build` (which runs `tsc -b`), and a manual smoke
test.

## Express storefront

`src/features/expressCheckout` is the "PageTurner" bookshop: listing (`/express`), detail (`/express/book/:id`), cart
(`/express/cart`), a unified checkout (`/express/checkout`) and result views (`/express/success`,
`/express/failure`). It renders beneath the global header through `ExpressChrome` in `App.tsx`.

- Styles are ported into `styles/pageturner.css` and scoped under `[data-flow="express"]`, not `@theme`. The config
  sheet portals to `document.body` and re-applies `data-flow="express"`.
- The cart is cleared by the success page on mount, and only for a cart order. Clearing it during checkout trips the
  empty-cart bounce and steals the navigation.
- Cart lines persist in `localStorage` (`pageturner.cart.v1`) as `{ id, quantity }[]` and rehydrate from `BOOKS`.
  Because the cart survives the returnUrl reload, a cold-loaded Success page clears it from the stash's `fromCart`
  or the cart checkout's LIST id (`markCartCheckoutList`). Success consumes that marker on every load.
- Checkout form email/name/country feed **card LIST** billing and est. tax only. Express buy-now and ECE keep
  `DEMO_*` and the config-sheet `country`. Do not merge the two country sources. The card LIST's top-level
  `country` stays the config country: OPG sets the card form language from it at creation.
- A committed form change updates the existing card LIST in place with a PUT, then calls `updateLongId` with the
  same longId. With checkout-web-stripe from PCPAY-5976 on, that refresh keeps the card form (typed card kept,
  billing details refreshed, a changed total applied in place); older builds re-create the form on every refresh,
  so don't ship this demo branch before that release reaches the CDN. Never put the buyer in the rebuild key: the
  blur that commits lands as the shopper clicks into a drop-in, and a rebuild destroys it. The card pre-charge gate
  waits for pending PUTs, so no update races the charge. Do not turn on `refetchListBeforeCharge` for this; it is
  a recovery mechanism.
- Card LIST totals use `cardTotalOf` (subtotal + shipping + est. tax). Tax rides each book line as `taxAmount`.
  Express amounts stay on `totalOf` / ECE rates (no tax). The receipt picks card vs wallet totals from the
  `onSubmitSuccess` `componentName`.

## SDK integration rules

- SDK types are derived from `@payoneer/checkout-web` (types-only devDependency), and `checkout.type-test.ts` guards
  drift (ADR-0001).
- One `CheckoutWeb` instance mounts both drop-ins (ADR-0002). Teardown is `destroy()` alone: it removes both
  drop-ins and every listener, and a charge already sent still reports through the callbacks (ADR-0004).
- Rebuild on relevant config changes. Express-only surfaces update the amount in place with
  `express.update({ amount })` (ADR-0003).
- Drive the express slot from the single `express:state` subscription. The handler receives the raw state object,
  not an `{ event, data }` envelope.
- Never hide the express slot with `display:none`. The SDK manages the element's visibility.
- Keep the three "shipping" concepts apart: the cart shipping fee (`shippingOf`), the synthetic LIST shipping
  address (`DEMO_SHIPPING`), and the wallet-sheet rates (`shipping.rates`). With wallet rates on, the express base is
  the goods subtotal, so shipping is charged once.
- `clientId` and `country` go on the init config. `VITE_EXPRESS_CLIENT_ID` is public, not a secret.

## Commands

```bash
npm run dev                         # http://localhost:3000/cards-component-demo/
EXPRESS_HTTPS=true npm run dev      # trusted HTTPS (mkcert), required for real wallets
npm run lint
npm run build                       # tsc -b + Vite build
npm run preview                     # serve the production build
```

Gate: `npm run lint && npm run build` (`../../scripts/check-all.sh cards-component-demo`).

Local SDK detection, the `/opg-proxy` route, HTTPS and troubleshooting are in `LOCAL_DEVELOPMENT.md`.

## Knowledge base

- Project decisions: `docs/ADR/README.md`. Cross-repo decisions: `../../docs/ADR/README.md`.
- Project learnings: `docs/solutions/README.md`. Cross-repo learnings: `../../docs/solutions/README.md`.
- ECE load performance: `../../docs/reference/express-performance.md`.
