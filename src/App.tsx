import { HoneycombWebSDK } from "@honeycombio/opentelemetry-web";
import { getWebAutoInstrumentations } from "@opentelemetry/auto-instrumentations-web";
import { useEffect } from "react";

const configDefaults = {
  ignoreNetworkEvents: true,
  // propagateTraceHeaderCorsUrls: [
  // /.+/g, // Regex to match your backend URLs. Update to the domains you wish to include.
  // ]
};

function App() {
  useEffect(() => {
    const sdk = new HoneycombWebSDK({
      endpoint: "otel-collector.dev.oscato.com",
      debug: true, // Set to false for production environment.
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
    <>
      <div></div>
    </>
  );
}

export default App;
