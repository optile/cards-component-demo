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
      // @ts-expect-error - window.hk_endpoint is not typed
      endpoint: window.hk_endpoint || "https://api.eu1.honeycomb.io/v1/traces", // Send to EU instance of Honeycomb. Defaults to sending to US instance.
      debug: true, // Set to false for production environment.
      // @ts-expect-error - window.api_key is not typed
      apiKey: window.hk_api_key || "[YOUR API KEY HERE]", // Replace with your Honeycomb Ingest API Key.
      // @ts-expect-error - window.service_name is not typed
      serviceName: window.hk_service_name || "[YOUR APPLICATION NAME HERE]", // Replace with your application name. Honeycomb uses this string to find your dataset when we receive your data. When no matching dataset exists, we create a new one with this name if your API Key has the appropriate permissions.
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
