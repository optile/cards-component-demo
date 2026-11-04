# cards-component-demo ADRs

Decisions internal to the demo. Cross-repo decisions live in the workspace `docs/ADR/README.md`. Use the workspace
template (`docs/ADR/TEMPLATE.md`) and the same four-digit numbering, scoped to this folder.

| ADR | Decision | Status |
| --- | -------- | ------ |
| [0001](0001-demo-types-derived-from-sdk.md) | Demo SDK types are derived from `@payoneer/checkout-web` | Accepted 2026-09-07 |
| [0002](0002-one-checkout-web-instance-for-both-drop-ins.md) | One `CheckoutWeb` instance for both drop-ins | Accepted 2026-08-20 |
| [0003](0003-broad-rebuild-boundary-express-only-updates-in-place.md) | Broad rebuild boundary; express-only amount updates in place | Accepted 2026-08-25 |
| [0004](0004-teardown-is-destroy-alone.md) | Tear a checkout session down with `destroy()` alone (supersedes the 0002 teardown order) | Proposed |
| [0005](0005-card-path-buyer-form-and-est-tax-on-list.md) | Card-path buyer form and est. tax feed the LIST session only | Proposed |
