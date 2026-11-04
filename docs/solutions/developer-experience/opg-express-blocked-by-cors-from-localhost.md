---
title: GET /pci/v1/express fails with CORS from https://localhost
projects: [cards-component-demo]
module: Demo SDK loader
date: 2026-08-20
problem_type: developer_experience
component: express-sdk-loader
symptoms:
  - "Browser blocks the SDK's GET /pci/v1/express request with a CORS error"
root_cause: The OPG host does not allow CORS from localhost, and the SDK calls it directly at the host it derives from env
resolution_type: config_change
severity: medium
tags: [cors, vite-proxy, opg, local-dev]
related:
  - projects/cards-component-demo/LOCAL_DEVELOPMENT.md
---

# Express lookup blocked by CORS from localhost

## Problem

The SDK derives the express URL from `env` (`Env.getExpressURL()`), so the browser calls the OPG host
directly from `https://localhost` and CORS blocks it.

## Root cause

OPG has no CORS allowance for `https://localhost`.

## Resolution

The fetch shim in `payoneerSdk.ts` rewrites any cross-origin `/pci/v1/express` request to the same-origin
`/opg-proxy` route, and Vite proxies it to `OPG_PROXY_TARGET`. The LIST `/checkout/session` POST stays
direct. The demo never hand-picks the express host. The SDK-derived URL is rerouted at the transport layer.

This needs the **local** `checkout-web` (8700) and `checkout-web-stripe` (8991). The published CDN builds
predate `getExpressURL`, `setExpressData`, and the per-account Stripe cache.

## Prevention

`OPG_PROXY_TARGET` must point at the same environment as the config sheet's `env`, where the express
`clientId` is provisioned.
