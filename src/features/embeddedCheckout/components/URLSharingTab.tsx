import React, { useState } from "react";
import { useEmbeddedConfigurationStore } from "@/features/embeddedCheckout/store/embeddedConfigurationStore";
import CollapsibleSection from "@/components/ui/CollapsibleSection";
import Button from "@/components/ui/Button";
import Checkbox from "@/components/ui/Checkbox";

const URLSharingTab: React.FC = () => {
  const { urlSharingEnabled, setUrlSharingEnabled } =
    useEmbeddedConfigurationStore();
  const [isCopying, setIsCopying] = useState(false);

  const handleCopyUrl = async () => {
    setIsCopying(true);
    try {
      await navigator.clipboard.writeText(window.location.href);
    } catch {
      // Silent failure - keep UI simple
    }
    setTimeout(() => setIsCopying(false), 1000);
  };

  const hasUrlConfig = () => {
    const hash = window.location.hash || "";
    return (
      hash.includes("checkout-storage") ||
      hash.includes("configuration-storage")
    );
  };

  return (
    <div className="space-y-6">
      <div className="border rounded-lg p-4 bg-gray-50">
        <h3 className="text-lg font-medium mb-4">URL Configuration Sharing</h3>

        <div className="space-y-4">
          <Checkbox
            checked={urlSharingEnabled}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setUrlSharingEnabled(e.target.checked)
            }
            label="Enable URL configuration sharing"
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />

          <div className="text-sm text-gray-600">
            {urlSharingEnabled ? (
              <p>✅ Configuration changes are saved to the URL.</p>
            ) : (
              <p>
                ❌ URL sharing is disabled. Changes will not be saved to the
                URL.
              </p>
            )}
          </div>

          {urlSharingEnabled && hasUrlConfig() && (
            <div className="mt-4">
              <Button
                onClick={handleCopyUrl}
                disabled={isCopying}
                variant="primary"
                className="inline-flex items-center text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                {isCopying ? "📋 Copying..." : "📋 Copy shareable URL"}
              </Button>
            </div>
          )}

          {!urlSharingEnabled && hasUrlConfig() && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-sm text-yellow-800">
                ⚠️ Current URL contains configuration data, but sharing is
                disabled.
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
              Save payment configurations and settings to easily return to them.
            </p>
          </div>

          <div className="text-sm text-green-800">
            <h5 className="font-medium mb-1">👥 Team Collaboration</h5>
            <p>
              Share exact configurations with colleagues for debugging or demos.
            </p>
          </div>

          <div className="text-sm text-green-800">
            <h5 className="font-medium mb-1">🐛 Bug Reporting</h5>
            <p>
              Include configuration URLs in bug reports to reproduce issues.
            </p>
          </div>

          <div className="text-sm text-green-800">
            <h5 className="font-medium mb-1">📋 Demo Preparation</h5>
            <p>Prepare demo scenarios and switch between them quickly.</p>
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
