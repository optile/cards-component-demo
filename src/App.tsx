import {
  BrowserRouter as Router,
  Routes,
  Route,
  Outlet,
  useLocation,
} from "react-router-dom";
import Header from "@/components/global/Header";
import ChooseFlow from "@/pages/ChooseFlow";
import SelectEnvironment from "@/features/embeddedCheckout/pages/SelectEnvironment";
import Checkout from "@/features/embeddedCheckout/pages/Checkout";
import HostedCheckout from "@/features/hostedCheckout/pages/HostedCheckout";
import {
  Listing,
  Detail,
  Cart,
  CheckoutView,
  Success,
  Failure,
} from "@/features/expressCheckout";
import { useEffect, useLayoutEffect, useState } from "react";
import ScrollToTop from "./components/global/ScrollToTop";
import { warmCheckoutWeb } from "@/features/expressCheckout/utils/expressSdk";
import { clearPrefetchedSessions } from "@/features/expressCheckout/units/expressPrefetch";
import { useExpressConfigStore } from "@/features/expressCheckout/store/expressConfigStore";

const configDefaults = {
  ignoreNetworkEvents: true,
  // propagateTraceHeaderCorsUrls: [
  // /.+/g, // Regex to match your backend URLs. Update to the domains you wish to include.
  // ]
};

let telemetryStarted = false;

// Telemetry is OFF by default. This is a public demo, so it never phones home unless an integrator
// explicitly opts in by setting BOTH VITE_ENABLE_TELEMETRY=true and a VITE_TELEMETRY_ENDPOINT (their
// own collector). No collector URL is baked into the source.
function App() {
  useLayoutEffect(() => {
    const endpoint = import.meta.env.VITE_TELEMETRY_ENDPOINT;
    if (
      import.meta.env.VITE_ENABLE_TELEMETRY !== "true" ||
      !endpoint ||
      telemetryStarted
    ) {
      return;
    }

    telemetryStarted = true;

    void (async () => {
      try {
        const [{ getWebAutoInstrumentations }, { HoneycombWebSDK }] =
          await Promise.all([
            import("@opentelemetry/auto-instrumentations-web"),
            import("@honeycombio/opentelemetry-web"),
          ]);

        const sdk = new HoneycombWebSDK({
          endpoint,
          debug: true,
          serviceName: "demo_page",
          instrumentations: [
            getWebAutoInstrumentations({
              "@opentelemetry/instrumentation-xml-http-request": configDefaults,
              "@opentelemetry/instrumentation-fetch": configDefaults,
              "@opentelemetry/instrumentation-document-load": configDefaults,
            }),
          ],
        });
        sdk.start();
      } catch (error) {
        console.warn("Error initializing Honeycomb:", error);
      }
    })();
  }, []);

  return (
    <Router basename="/cards-component-demo">
      <ScrollToTop />
      <Routes>
        {/* Payoneer demo chrome (global header + centered container) for the SDK flows. */}
        <Route element={<DemoChrome />}>
          <Route path="/" element={<ChooseFlow />} />
          <Route path="/embedded" element={<SelectEnvironment />} />
          <Route path="/embedded/:env" element={<Checkout />} />
          <Route path="/hosted" element={<HostedCheckout />} />
        </Route>

        {/* Express PageTurner storefront — full-bleed under the global Payoneer header. */}
        <Route element={<ExpressChrome />}>
          <Route path="/express" element={<Listing />} />
          <Route path="/express/book/:id" element={<Detail />} />
          <Route path="/express/cart" element={<Cart />} />
          {/* The checkout UI is rendered by the persistent keep-alive surface in ExpressChrome (so its
              Stripe iframes survive navigation); this route only needs to exist so the path matches
              the express layout. */}
          <Route path="/express/checkout" element={null} />
          <Route path="/express/success" element={<Success />} />
          <Route path="/express/failure" element={<Failure />} />
        </Route>
      </Routes>
    </Router>
  );
}

function DemoChrome() {
  return (
    <div className="min-h-screen relative bg-white dark:bg-gray-800">
      <Header />
      <main className="flex justify-center p-4 mt-[60px] container mx-auto">
        <Outlet />
      </main>
    </div>
  );
}

// Keeps the global Payoneer header (with its flow switcher) above the full-bleed PageTurner shop.
// ShopChrome offsets its own sticky header by the 60px header height so the two don't overlap.
//
// Checkout is a KEEP-ALIVE surface: once opened, it stays mounted for the rest of the shop session
// and is merely hidden (display:none) when off the checkout route, so its Stripe iframes (card + ECE)
// survive round-trips and re-display instantly. It's a stable sibling of <Outlet> — never re-parented
// or portaled — because moving an iframe in the DOM reloads it, which is exactly what we're avoiding.
// It's not built eagerly: we wait until the first visit so we don't create a LIST session before the
// user asks for checkout. Leaving the express section entirely unmounts ExpressChrome, tearing it down.
function ExpressChrome() {
  const { pathname } = useLocation();
  const onCheckout = pathname === "/express/checkout";
  const [hasOpenedCheckout, setHasOpenedCheckout] = useState(onCheckout);
  useLayoutEffect(() => {
    if (onCheckout) setHasOpenedCheckout(true);
  }, [onCheckout]);

  // Preload the checkout-web SDK as soon as the storefront mounts (while the shopper is still on the
  // listing) so the first express element they open — a book detail or checkout — appears without
  // waiting on the SDK bundle download. Warm-up is idempotent and env-agnostic once loaded. On the way
  // out, tear down any sessions warmed on hover/press but never opened so no instance lingers.
  useEffect(() => {
    warmCheckoutWeb(useExpressConfigStore.getState().env);
    return () => clearPrefetchedSessions();
  }, []);

  return (
    <>
      <Header />
      {hasOpenedCheckout && (
        <div style={{ display: onCheckout ? undefined : "none" }} aria-hidden={!onCheckout}>
          <CheckoutView active={onCheckout} />
        </div>
      )}
      <Outlet />
    </>
  );
}

export default App;
