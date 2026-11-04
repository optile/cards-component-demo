---
title: Express charge risks charging shipping twice when the cart fee and wallet-sheet rates are confused
projects: [cards-component-demo]
module: Express storefront
date: 2026-08-27
problem_type: logic_error
component: express-shipping-demo
symptoms:
  - "Express total includes the $5 flat cart shipping fee and the rate picked in the wallet sheet"
root_cause: The demo has three unrelated things called "shipping", and the express base amount used the cart total that already included the flat fee
resolution_type: code_fix
severity: high
tags: [money, shipping, naming, express]
---

# Three "shipping" concepts can double-charge

## Problem

With wallet-sheet rates enabled, the express charge base was the cart **total**, which already included the
flat shipping fee, and the buyer's selected rate was then added on top.

## Root cause

Three distinct concepts share the name:

1. The cart line-item shipping fee (`shippingOf`: $5 flat, free over $50), injected as a LIST product line so
   the LIST and card totals match the order.
2. `DEMO_SHIPPING`, the synthetic LIST-session shipping **address**.
3. The ECE `shipping.rates` the buyer picks in the wallet sheet.

## Resolution

When ECE rates are on, the express base is the goods **subtotal** (`useCheckoutSession` uses `subtotalOf`,
not `totalOf`), and the selected rate replaces concept 1 for express only. The LIST session still includes
concept 1, via `createExpressSession`, so the card and LIST totals keep matching the displayed order.

## Prevention

Name variables by concept (`cartShippingFee`, `listShippingAddress`, `eceRates`). Any change to express
money has a check that the charged total equals subtotal plus the selected rate.
