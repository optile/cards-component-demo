# ADR-0001: Demo SDK types are derived from `@payoneer/checkout-web`, not re-declared

## Status

Accepted (2026-09-07; tracker O6).

- **Supersedes:** hand-written local copies of the SDK types
- **Sources:** workspace `docs/superpowers/specs/2026-09-07-derive-demo-express-types-from-sdk-design.md`, workspace
  learning `docs/solutions/build-errors/demo-typecheck-green-locally-red-in-ci-20260910.md`

## Context

The demo loads the SDK from the CDN through `window.Payoneer`, so nothing forced its local type copies to match the
real SDK. They drifted. The demo is also the reference integrators copy from, so drift teaches the wrong API.

## Decision

- `@payoneer/checkout-web` is a types-only devDependency. There is no runtime or bundle cost.
- `src/features/embeddedCheckout/types/checkout.ts` aliases the SDK's public exports (`Checkout`, `DropIn`,
  `ExpressDropIn`, `ExpressDropInConfig`, `CheckoutConfigurationProps`, the callback types, and so on).
- `checkout.type-test.ts` fails `tsc -b` when the demo diverges from the SDK.
- Only demo-owned shapes stay local: the demo backend's session request and response, the `INTEGRATION_TYPE` enum,
  and the CDN rehost manifest `CheckoutWebMetaInfo`.

### Alternatives considered

- **Keep local types and review them by hand** - this is how they drifted in the first place.

## Consequences

- A typecheck can pass locally against a linked SDK and fail in CI against the published version. Check which
  SDK version resolves before trusting a green local run.
