---
title: Clearing the cart inside placeOrder() bounces the shopper back instead of reaching the success page
projects: [cards-component-demo]
module: Express storefront
date: 2026-08-20
problem_type: logic_error
component: express-storefront
symptoms:
  - "After a successful payment the shopper lands on the empty-cart redirect instead of /express/success"
root_cause: Emptying the cart while still on /express/checkout trips that route's empty-cart bounce before the success navigation runs
resolution_type: code_fix
severity: medium
tags: [react-router, zustand, navigation, cart]
---

# Clearing the cart on checkout steals the success navigation

## Problem

Clearing the cart inside `placeOrder()` makes the checkout route's empty-cart guard fire first and redirect,
so the success navigation is lost.

## Root cause

The cart is cleared while the checkout route is still mounted, and that route redirects when the cart is
empty.

## Resolution

- `placeOrder()` only snapshots the cart into `lastOrder` and marks `lastOrderFromCart`.
- `placeOrderFor(items)` snapshots a single book for PDP buy-now without touching the cart.
- The **Success page clears the cart on mount**, and only for a cart order. Because the cart is cleared on
  arrival, leaving the receipt by any route cannot strand purchased items.

## Prevention

Side effects that invalidate the current route's preconditions run on the destination route, not before
navigating.
