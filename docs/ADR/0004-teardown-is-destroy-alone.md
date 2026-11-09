# ADR-0004: Tear a checkout session down with `destroy()` alone

## Status

Accepted (2026-10-07, PCPAY-5901, #127).

- **Supersedes:** [ADR-0002](0002-one-checkout-web-instance-for-both-drop-ins.md) (the teardown order only)
- **Sources:** `src/features/expressCheckout/hooks/useCheckoutSession.ts`, `units/expressElement.ts`
  (`mountExpressElement`), PCPAY-5901 / PCPAY-5902

## Context

ADR-0002 tore a session down with `off('express:state')`, `remove('express')`, `remove('cards')`, then `destroy()`.
The extra steps came from the SDK leaving the Express button in place on `remove()` and `unmount()`, and from not
knowing what a teardown mid-payment would do.

The SDK now removes the Express button on `unmount()`, `remove('express')` and `destroy()`, and a payment whose
charge request was sent still reports through `onSubmitSuccess` / `onSubmitError` after the teardown.
`destroy()` unmounts every drop-in and removes every listener, so the steps before it repeat what it
already does. Against an SDK without that change, `remove('express')` and `destroy()` both leave the Express
button in place, so dropping the extra steps changes nothing there.

The demo is the reference integrators copy from, so it should show the shortest correct teardown.

## Decision

- `useCheckoutSession` tears a session down with `instance.destroy()` only, in its effect cleanup and for an
  orphan instance built after a cancel.
- `mountExpressElement` returns the express handle and no cleanup. It subscribes to `express:state` and
  `express:order` on the caller's instance, and the caller's `destroy()` removes those listeners.
- Handlers that write React state still check the effect's `cancelled` flag, so an event delivered while the
  teardown runs does not write into a session that has gone.
- `useCheckoutSession` passes the host ids stamped on its express handle (`transactionId`, `paymentReference`) to
  `onSubmitSuccess` / `onSubmitError` as an argument. They used to live in the express store, which teardown
  cleared and the next session overwrote, so a payment settling after its teardown showed no ids or another
  session's.

### Alternatives considered

- **Keep the ADR-0002 order** - correct but redundant, and integrators copy it as if each step were needed.

## Consequences

- One teardown call per session. The express subscription can no longer outlive its instance by a missed `off`.
- A shopper who leaves the checkout mid-charge still lands on the result page, because the callbacks survive the
  teardown. After `destroy()` no public events arrive, so the demo must not rely on a late `express:order` or
  `payment:*` event for the result page.
- Revisit if the demo ever needs to remove one drop-in while keeping the other (for example, dropping the card
  form but keeping Express), which needs `remove(name)` again.
