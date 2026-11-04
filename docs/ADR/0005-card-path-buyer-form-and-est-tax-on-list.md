# ADR-0005: Card-path buyer form and est. tax feed the LIST session only

## Status

Proposed

- **Projects:** `cards-component-demo`
- **Supersedes:** -
- **Sources:** `docs/superpowers/specs/2026-10-19-pageturner-shop-realism-design.md`

## Context

PageTurner's checkout form (email, name, country) was decorative while LIST billing always
used `DEMO_BILLING` and the config-sheet country. Adding shop realism required choosing whether
form values and estimated tax affect express wallets, the card LIST session, both, or neither.

Express wallet sheets collect their own buyer address. Feeding the form into express would
fight that model and couple remounts to every form edit. Display-only tax would make the card
summary lie about the authorized amount.

## Decision

- Checkout form identity and country replace `DEMO_*` **only** when building the card LIST
  session (`createExpressSession` / card surface). Street stubs may remain from `DEMO_BILLING`.
- Estimated tax is included in the card LIST amount as per-line `taxAmount` on the book lines.
  Express charge amounts stay on the existing subtotal / ECE shipping-rate path with **no** tax.
- A committed form change updates the existing card LIST in place (`PUT /checkout/session/{id}`,
  then `updateLongId`). The buyer is not part of the session rebuild key.
- Express buy-now and express drop-in keep `DEMO_BILLING` / `DEMO_SHIPPING` and config-sheet
  `country`.
- Totals for the card path are computed in integer minor units and formatted at the edge.

Enforcement lives in `expressSdk.createExpressSession`, checkout totals helpers, and
`CheckoutView` buyer state — not in the express drop-in assembly.

### Alternatives considered

- **Display-only form and tax** — rejected: charged card amount would not match the summary.
- **Feed form into express as well** — rejected: wallets own address; remount noise; fights ECE.
- **Shared commerce module across slices** — rejected: YAGNI for a thin SDK demo.

## Consequences

- Form edits never remount either drop-in. The commit happens on blur, often as the shopper clicks
  into the card form or a wallet button, and the shared instance (ADR-0002) would otherwise be
  destroyed under that click. A failed LIST update falls back to a rebuild for the latest buyer.
- Config-sheet country and form country can differ by design; document that split in AGENTS.md
  when implementing.
- Integrators copying the demo see a realistic card path and an honest express path.
- Revisit if the demo later needs a single country source of truth for both surfaces.
