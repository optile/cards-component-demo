import React, { useEffect, useState } from "react";
import { useCheckoutStore } from "@/features/embeddedCheckout/store/checkoutStore";
import InfoTooltip from "@/components/ui/InfoTooltip";
import Button from "@/components/ui/Button";

const LocalModeToggle: React.FC = () => {
  const { localServersStatus, isDetectingServers, detectLocalServers } =
    useCheckoutStore();

  const [isCollapsed, setIsCollapsed] = useState(() => {
    const stored = localStorage.getItem("localModeCollapsed");
    return stored ? JSON.parse(stored) : false;
  });

  useEffect(() => {
    detectLocalServers();
  }, [detectLocalServers]);

  const handleRefreshServers = async () => {
    await detectLocalServers();
  };

  const toggleCollapsed = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem("localModeCollapsed", JSON.stringify(newState));
  };

  const { checkoutWeb, checkoutWebStripe } = localServersStatus;
  const anyServerAvailable = checkoutWeb || checkoutWebStripe;

  // Only show in development (localhost)
  if (
    typeof window !== "undefined" &&
    !window.location.hostname.includes("localhost")
  ) {
    return null;
  }

  return (
    <div className="flex flex-col gap-4 p-4 border border-gray-300 rounded-lg bg-gray-50">
      <div className="flex gap-1 items-center justify-between">
        <div className="flex gap-1 items-center">
          <h3 className="font-semibold">Local Development Mode</h3>
          <InfoTooltip content="Use local versions of checkout-web and/or checkout-web-stripe for development and testing. Mixed mode is supported - run just one dev server or both on ports 8700 and 8991." />
        </div>
        <button
          type="button"
          onClick={toggleCollapsed}
          className="text-gray-600 hover:text-gray-800 transition-colors"
          aria-label={isCollapsed ? "Expand" : "Collapse"}
        >
          {isCollapsed ? "▼" : "▲"}
        </button>
      </div>

      {!isCollapsed && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Button
              onClick={handleRefreshServers}
              disabled={isDetectingServers}
            >
              {isDetectingServers ? "Detecting..." : "Refresh Servers"}
            </Button>
          </div>

          {/* Server status indicators */}
          <div className="flex flex-col gap-2">
            <div className="text-sm">
              <span className="font-medium">Local Server Status:</span>
            </div>
            <div className="flex flex-col gap-1 text-sm">
              <div className="flex items-center gap-2">
                <span
                  className={`inline-block w-3 h-3 rounded-full ${
                    checkoutWeb ? "bg-green-500" : "bg-red-500"
                  }`}
                />
                <span>
                  checkout-web (localhost:8700) -{" "}
                  {checkoutWeb ? "Running" : "Not detected"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`inline-block w-3 h-3 rounded-full ${
                    checkoutWebStripe ? "bg-green-500" : "bg-red-500"
                  }`}
                />
                <span>
                  checkout-web-stripe (localhost:8991) -{" "}
                  {checkoutWebStripe ? "Running" : "Not detected"}
                </span>
              </div>
            </div>
          </div>

          {/* Info message about current mode */}
          <div className="mt-2 p-3 bg-blue-100 border border-blue-400 rounded text-sm">
            <strong>ℹ️ Current Mode:</strong>{" "}
            {!anyServerAvailable && "Using remote CDN for both libraries"}
            {checkoutWeb && !checkoutWebStripe && "Using local checkout-web + CDN stripe"}
            {!checkoutWeb && checkoutWebStripe && "Using CDN checkout-web + local stripe"}
            {checkoutWeb && checkoutWebStripe && "Using local versions of both libraries"}
            <div className="mt-2">
              <strong>Mixed Mode Support:</strong> You can run just one dev server or
              both. The app will use local versions when available and fall back to
              CDN for the rest.
              <ul className="list-disc ml-5 mt-1">
                <li>
                  checkout-web: Run <code>npm run dev</code> in checkout-web
                  directory (port 8700)
                </li>
                <li>
                  checkout-web-stripe: Run <code>npm run dev</code> in
                  checkout-web-stripe directory (port 8991)
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LocalModeToggle;
