import React from "react";
import { useEmbeddedConfigurationStore } from "../../store/embeddedConfigurationStore";
import CollapsibleSection from "../ui/CollapsibleSection";

const URLSharingTab: React.FC = () => {
  const { urlSharingEnabled, setUrlSharingEnabled } =
    useEmbeddedConfigurationStore();

  const handleCopyUrl = () => {
    const currentUrl = window.location.href;
    navigator.clipboard
      .writeText(currentUrl)
      .then(() => {
        // You could add a toast notification here if you have one
        console.log("URL copied to clipboard");
      })
      .catch((err) => {
        console.error("Failed to copy URL:", err);
      });
  };

  const hasUrlConfig = () => {
    return (
      location.hash.includes("checkout-storage") ||
      location.hash.includes("configuration-storage")
    );
  };

  return (
    <div className="space-y-6">
      <div className="border rounded-lg p-4 bg-gray-50">
        <h3 className="text-lg font-medium mb-4">URL Configuration Sharing</h3>

        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="url-sharing-enabled"
              checked={urlSharingEnabled}
              onChange={(e) => setUrlSharingEnabled(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label
              htmlFor="url-sharing-enabled"
              className="text-sm font-medium text-gray-700"
            >
              Enable URL configuration sharing
            </label>
          </div>

          <div className="text-sm text-gray-600">
            {urlSharingEnabled ? (
              <p>
                ✅ Configuration changes are automatically saved to the URL and
                can be shared with others.
              </p>
            ) : (
              <p>
                ❌ URL sharing is disabled. Configuration changes will not be
                saved to the URL.
              </p>
            )}
          </div>

          {urlSharingEnabled && hasUrlConfig() && (
            <div className="mt-4">
              <button
                onClick={handleCopyUrl}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                📋 Copy shareable URL
              </button>
            </div>
          )}

          {!urlSharingEnabled && hasUrlConfig() && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-sm text-yellow-800">
                ⚠️ Current URL contains configuration data, but sharing is
                disabled. Enable sharing above to make your configuration
                changes persist in the URL.
              </p>
            </div>
          )}
        </div>
      </div>

      <CollapsibleSection
        title="Common Use Cases"
        bgColor="bg-green-50"
        titleColor="text-green-900"
        icon="💡"
        defaultExpanded={false}
      >
        <div className="space-y-3">
          <div className="text-sm text-green-800">
            <h5 className="font-medium mb-1">
              🔖 Personal Configuration Storage
            </h5>
            <p>
              Save specific payment configurations, merchant settings, and UI
              preferences to easily return to them later. Bookmark URLs with
              different test scenarios for quick access during development.
            </p>
          </div>

          <div className="text-sm text-green-800">
            <h5 className="font-medium mb-1">👥 Team Collaboration</h5>
            <p>
              Share exact configurations with colleagues for debugging, testing,
              or demonstration purposes. Everyone gets the same setup instantly
              without manual configuration.
            </p>
          </div>

          <div className="text-sm text-green-800">
            <h5 className="font-medium mb-1">🐛 Bug Reporting</h5>
            <p>
              Include configuration URLs in bug reports to help developers
              reproduce issues with the exact same settings, payment methods,
              and environment configurations.
            </p>
          </div>

          <div className="text-sm text-green-800">
            <h5 className="font-medium mb-1">📋 Demo Preparation</h5>
            <p>
              Prepare multiple demo scenarios with different configurations and
              switch between them quickly during presentations or client
              meetings.
            </p>
          </div>
        </div>
      </CollapsibleSection>

      <CollapsibleSection
        title="How URL Sharing Works"
        bgColor="bg-blue-50"
        titleColor="text-blue-900"
        icon="ℹ️"
        defaultExpanded={false}
      >
        <ul className="text-sm text-blue-800 space-y-1">
          <li>
            • When enabled: All configuration changes are automatically saved to
            the URL
          </li>
          <li>
            • When disabled: Changes are kept in memory only (lost on page
            refresh)
          </li>
          <li>
            • URLs always load their configuration, regardless of this setting
          </li>
          <li>
            • Disabling will immediately clear any existing URL configuration
          </li>
        </ul>
      </CollapsibleSection>
    </div>
  );
};

export default URLSharingTab;
