# Local Development

Quick reference for running the demo locally. For full details see `README.md`.

## Run it

```bash
npm install
npm run dev        # http://localhost:3000/cards-component-demo/
```

That's all you need for the Embedded and Hosted flows and for browsing the Express storefront UI.

## Express Checkout (wallets)

Route: `http://localhost:3000/cards-component-demo/express`

To actually render Apple Pay / Google Pay you need two things:

1. **A client ID** — a public integration token is baked in, so it works out of the box.
   Override with a `.env` (`VITE_EXPRESS_CLIENT_ID=...`) or live in the ⚙ config sheet.
2. **Trusted HTTPS** — wallets refuse to render over plain HTTP, and Google Pay's
   `canMakePayment()` also refuses over an **untrusted** cert (Chrome flags a self-signed
   cert as "DANGEROUS" and disables the Payment Request API, so the Express element shows no
   wallet button even though the card form still shows a Google Pay *tab*). Start with HTTPS:

   ```bash
   EXPRESS_HTTPS=true npm run dev
   # opens https://localhost:3000/cards-component-demo/express
   ```

   `EXPRESS_HTTPS=true` enables `vite-plugin-mkcert`, which issues a **browser-trusted**
   localhost cert (it installs a local CA the first run — you may get a one-time
   keychain/sudo prompt). No "your connection is not private" click-through, and Google Pay
   works. If you already use `mkcert` for the checkout-web-stripe demo, the existing CA is reused.

   > **This HTTPS path needs Node ≥ 22.19.** `vite-plugin-mkcert@2` declares `node >=22.19`, so on
   > Node 20.x / 22.12–22.18 `npm install` prints an `EBADENGINE` warning and HTTPS may not start.
   > Plain `npm run dev` (HTTP) works across the whole supported Node range (Vite 8: `20.19+ / 22.12+`);
   > only real wallet testing over HTTPS requires the newer Node.

   - **Google Pay**: works on trusted `https://localhost` in Chrome, no domain registration.
   - **Apple Pay**: needs a Stripe-registered HTTPS domain — front the dev server with a tunnel
     (`ngrok http 3000`) and register that domain with Stripe.

## Env knobs (all optional)

| Var | Purpose | Default |
| --- | --- | --- |
| `VITE_EXPRESS_CLIENT_ID` | Override the baked-in express client ID | baked-in public demo token (the one the checkout-web-stripe `express.html` sample uses) |
| `EXPRESS_HTTPS` | Serve the dev server over HTTPS with a browser-trusted mkcert cert (required for wallet testing) | `false` (plain HTTP) |
| `OPG_PROXY_TARGET` | Backend host the `/opg-proxy` route (and thus the rerouted express fetch) points at | `https://api.checkout.integration.oscato.com` |

Both the card LIST and the express token run on the `env` selected in the config sheet. checkout-web owns
the `GET /pci/v1/express` fetch and derives its host from `env`; the host page supplies no URL (symmetric
with the card element's `setListData`). The browser can't call that OPG host directly from
`https://localhost` (no CORS), so in dev the fetch shim rewrites any cross-origin `/pci/v1/express` call
to the same-origin `/opg-proxy` route, which Vite proxies to `OPG_PROXY_TARGET` server-to-server. The card
LIST (`/checkout/session`) goes direct.

> Exercising this requires the **local** SDKs (ports 8700/8991, below): the published CDN builds
> predate the SDK-owned express fetch (`getExpressURL` + `setExpressData`) and the per-account Stripe
> cache. A real integration on a deployed origin needs none of this rerouting.

To run the flow on `sandbox`, point the proxy there and pick `sandbox` in the config sheet:

```bash
OPG_PROXY_TARGET=https://api.sandbox.oscato.com \
EXPRESS_HTTPS=true npm run dev
```

## Config sheet (⚙)

Bottom-right button on the Express pages. Live-edits `env` (`checkout.integration` / `sandbox`), `clientId`, `country` (default `US`), `locale`, `walletMode`, per-wallet visibility
(`auto` / `always` / `never`), `expressOperationType` (default `charge`), the Express capture
`expressDeferral` (default Immediate, which omits it; Deferred needs `preset`), and the "allow real redirect" toggle.
Each change remounts the Express element. Settings persist to `localStorage`.

> The `env` selection drives the LIST session (cards), the SDK asset host, **and** the express
> `GET /pci/v1/express` host (checkout-web derives it from `env`). In dev the fetch shim sends that
> express call through `OPG_PROXY_TARGET`, so keep the proxy target on the same environment as `env`.

## Local SDK mode (optional)

Test local `checkout-web` / `checkout-web-stripe` changes without deploying:

```bash
# in checkout-web
npm run dev            # port 8700
# in checkout-web-stripe
npm run dev            # port 8991
```

The demo auto-detects them (Vite proxies `/local-checkout-web` and `/local-checkout-web-stripe`)
and falls back to the CDN for whichever isn't running. Works with the Express flow too.

## Troubleshooting

- **Express element renders nothing (but the card form shows a Google Pay tab)**: the page cert
  is not browser-trusted. Chrome logs `SSL certificate is not valid. Security level: DANGEROUS` /
  `CanMakePayment ... will always return false`, which disables Google Pay in the Express element.
  Serve with `EXPRESS_HTTPS=true` (mkcert, trusted) — not plain HTTP or an untrusted self-signed cert.
- **Wallet slot stays hidden**: expected over plain HTTP — use `EXPRESS_HTTPS=true`. Real wallets also
  require being signed into Google Pay (Chrome) with a saved card.
- **mkcert prompts for a password the first run**: it's installing the local CA into your trust store
  (one-time). Alternatively run `mkcert -install` yourself beforehand.
- **Server-side rejection (LIST session or charge)**: confirm the `env` in the config sheet matches
  the environment your client ID is provisioned for.
- **Changed a local SDK server**: refresh the page after starting/stopping `checkout-web` (8700).
