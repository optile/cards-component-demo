# ADR-0003: Rebuild the session on any relevant change, except amount on express-only surfaces

## Status

Accepted (2026-08-25; narrowed for express-only surfaces with S8).

- **Supersedes:** rebuilding on every amount change everywhere
- **Sources:** `src/features/expressCheckout/hooks/useCheckoutSession.ts` (`expressSessionKey`, `reinitSignatureOf`), workspace ADR-0019

## Context

The demo is a QA surface, so a race-free teardown matters more than avoiding a remount. LIST is authoritative for the
card charge, so a card surface must regenerate its session when the cart changes. An express-only buy-now page has no
LIST-backed total.

## Decision

- Changes to `env`, `walletMode`, `expressWallets`, `expressOperationType`, `expressDeferral`, `cardDeferral` (card surfaces), cart items or quantities, `amount`,
  `currency`, `country`, `locale`, or the shipping QA toggles regenerate both the LIST session and `CheckoutWeb`.
- On an express-only surface, `expressSessionKey(..., includeCart = false)` drops the cart and amount from the
  identity. A quantity change goes through `express.update({ amount })` instead.
- `locale` keeps the full rebuild, even though the SDK can remount in place, to keep teardown race-free.
- The static shipping rate preset is excluded from the remount identity and always re-derived from the default.

### Alternatives considered

- **Use `update()` for everything it supports** - more paths to test, for little demo value.

## Consequences

- QA sees a short rebuild on most config changes. That is intended.
