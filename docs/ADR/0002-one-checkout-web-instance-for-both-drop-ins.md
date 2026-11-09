# ADR-0002: One `CheckoutWeb` instance mounts both the express and card drop-ins on the checkout page

## Status

Accepted (2026-08-20). Teardown order superseded by [ADR-0004](0004-teardown-is-destroy-alone.md).
Since PCPAY-5947, a second instance no longer loads Stripe.js again with a checkout-web that
includes it; one instance stays the recommended model.

- **Supersedes:** two `CheckoutWeb` instances, one per drop-in
- **Sources:** `src/features/expressCheckout/hooks/useCheckout.ts`, `hooks/useCheckoutSession.ts`

## Context

With two instances the page created two sessions and loaded Stripe.js twice. They also collided on the Stripe
singleton, which was fixed later in `checkout-web-stripe` (per-account cache).

## Decision

- `useCheckout` creates one LIST session and one instance. It mounts `dropIn('express')` immediately and
  `dropIn('cards')` once the component appears through `onComponentListChange`.
- `onSubmitSuccess` and `onSubmitError` are shared by both drop-ins and feed one `lastOutcome`, which routes to the
  success or failure view.
- One teardown, always in this order: `off('express:state')`, `remove('express')`, `remove('cards')`, then
  `destroy()`. Without `destroy()`, the element and event bus leak across rebuilds.
- `ExpressSlot` and `CardSlot` are presentational. The hook is called once, in `CheckoutView`.

### Alternatives considered

- **One instance per drop-in** - duplicate sessions and Stripe loads, and it hid the singleton bug.

## Consequences

- A rebuild tears down both drop-ins together.
- `destroy()` clears the bus, so every fresh instance must subscribe to `express:state` again.
