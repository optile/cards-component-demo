---
title: Starting or stopping a local SDK server is not picked up until a hard refresh
projects: [cards-component-demo]
module: Demo SDK loader
date: 2026-08-26
problem_type: developer_experience
component: express-sdk-loader
symptoms:
  - "Demo keeps loading the CDN SDK after npm run dev was started in checkout-web or checkout-web-stripe"
  - "Warm-up or detection changes have no effect after an HMR update"
root_cause: Local-server detection (resolveLocalMode) and the SDK warm-up are memoized at module level, and HMR does not always reset them
resolution_type: workaround
severity: low
tags: [vite, hmr, local-dev, sdk-loader]
---

# Local SDK detection is cached across HMR

## Problem

The demo health-checks `localhost:8700` (checkout-web) and `localhost:8991` (checkout-web-stripe) and falls
back to the CDN. After a local server was started mid-session, the demo kept using the CDN build.

## Root cause

`resolveLocalMode` and the warm-up in `expressSdk.ts` are module-level memos, so they are not re-run when
the page hot-reloads.

## Resolution

Hard-refresh the browser after starting or stopping a local SDK server, or after changing detection or
warm-up code.

## Prevention

The local-dev recipe (`LOCAL_DEVELOPMENT.md`) starts the SDK servers
before the demo.
