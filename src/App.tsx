import { HashRouter as Router, Routes, Route } from "react-router-dom";
import Header from "@/components/global/Header";
import ChooseFlow from "@/pages/ChooseFlow";
import Checkout from "@/features/embeddedCheckout/pages/Checkout";
import HostedCheckout from "@/features/hostedCheckout/pages/HostedCheckout";
import { getWebAutoInstrumentations } from "@opentelemetry/auto-instrumentations-web";
import { HoneycombWebSDK } from "@honeycombio/opentelemetry-web";
import { useLayoutEffect } from "react";

const configDefaults = {
  ignoreNetworkEvents: true,
  // propagateTraceHeaderCorsUrls: [
  // /.+/g, // Regex to match your backend URLs. Update to the domains you wish to include.
  // ]
};

function App() {
  useLayoutEffect(() => {
    const sdk = new HoneycombWebSDK({
      // endpoint: "otel-collector.dev.oscato.com", // crashing the app  if uncommented (Configuration: Could not parse user-provided export URL: 'otel-collector.dev.oscato.com/v1/traces')
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
  }, []);

  return (
    <Router basename="/">
      <div className="min-h-screen bg-white dark:bg-gray-800">
        <Header />
        <main className="flex justify-center p-4">
          <Routes>
            <Route path="/" element={<ChooseFlow />} />
            <Route path="/embedded" element={<Checkout />} />
            <Route path="/hosted" element={<HostedCheckout />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
