import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Header from "@/components/global/Header";
import ChooseFlow from "@/pages/ChooseFlow";
import Checkout from "@/features/embeddedCheckout/pages/Checkout";
import HostedCheckout from "@/features/hostedCheckout/pages/HostedCheckout";
import { getWebAutoInstrumentations } from "@opentelemetry/auto-instrumentations-web";
import { HoneycombWebSDK } from "@honeycombio/opentelemetry-web";
import { useLayoutEffect } from "react";
import ScrollToTop from "./components/global/ScrollToTop";

const configDefaults = {
  ignoreNetworkEvents: true,
  // propagateTraceHeaderCorsUrls: [
  // /.+/g, // Regex to match your backend URLs. Update to the domains you wish to include.
  // ]
};

function App() {
  useLayoutEffect(() => {
    try {
      const sdk = new HoneycombWebSDK({
        endpoint: "https://otel-collector.dev.oscato.com",
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
  }, []);

  return (
    <Router basename="/cards-component-demo">
      <div className="min-h-screen relative bg-white dark:bg-gray-800">
        <ScrollToTop />
        <Header />
        <main className="flex justify-center p-4 mt-[60px] container mx-auto">
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
