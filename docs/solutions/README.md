# cards-component-demo - solutions

Single-repo learnings. Cross-repo ones live in the workspace
[`docs/solutions`](../../../../docs/solutions/README.md). Same format and
[template](../../../../docs/solutions/TEMPLATE.md).

## Index

### developer-experience

- [local-sdk-detection-cached-across-hmr](developer-experience/local-sdk-detection-cached-across-hmr-20260826.md) - Hard-refresh after starting or stopping a local SDK server.
- [opg-express-blocked-by-cors-from-localhost](developer-experience/opg-express-blocked-by-cors-from-localhost.md) - The fetch shim reroutes `/pci/v1/express` to the Vite `/opg-proxy` (`OPG_PROXY_TARGET`).

### logic-errors

- [clearing-cart-on-checkout-steals-success-navigation](logic-errors/clearing-cart-on-checkout-steals-success-navigation-20260820.md) - Clear the cart on Success page mount, not in `placeOrder()`.
- [three-shipping-concepts-double-charge](logic-errors/three-shipping-concepts-double-charge-20260827.md) - Cart fee, LIST address and ECE rates are different things. The express base is the subtotal when ECE rates are on.
