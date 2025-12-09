import React, { useEffect, useState } from "react";
import { useCheckoutStore } from "@/features/embeddedCheckout/store/checkoutStore";
import Button from "@/components/ui/Button";
import Checkbox from "@/components/ui/Checkbox";
import InfoTooltip from "@/components/ui/InfoTooltip";
import ExternalLink from "@/components/ui/ExternalLink";

const SDKBaseConfiguration: React.FC = () => {
  const {
    env,
    preload,
    refetchListBeforeCharge,
    updateSdkConfig,
    checkoutLoading,
    checkoutError,
  } = useCheckoutStore();
  const [selectedRefetch, setSelectedRefetch] = useState(
    refetchListBeforeCharge
  );

  useEffect(() => {
    setSelectedRefetch(refetchListBeforeCharge);
  }, [refetchListBeforeCharge]);

  const hasChanges = selectedRefetch !== refetchListBeforeCharge;

  const handleSave = async () => {
    await updateSdkConfig({
      refetchListBeforeCharge: selectedRefetch,
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-1 items-center">
        <h3>SDK Base Configuration</h3>
        <ExternalLink link="https://checkoutdocs.payoneer.com/checkout-2/docs/basic-integration-checkout-web-sdk" />
      </div>
      <div className="flex flex-col gap-2">
        <span className="font-medium">Environment:</span>
        <div className="flex items-center gap-3">
          <span className="px-3 py-2 bg-blue-50 border border-blue-200 rounded font-mono text-sm">
            {env}
          </span>
          <a
            href="/cards-component-demo/embedded"
            className="inline-block px-4 py-2 rounded-md bg-gray-600 text-white hover:bg-gray-700 text-sm no-underline"
          >
            Change Environment
          </a>
        </div>
        <p className="text-xs text-gray-500">
          To switch environments, you'll be redirected to environment selection.
          Your cart and configuration data will be preserved.
        </p>
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-1">
          <span>Preloaded Components:</span>
          <InfoTooltip content="The components that will be preloaded in the SDK. Stripe:cards is preloaded since it is the preselected option for payment." />
          <ExternalLink link="https://checkoutdocs.payoneer.com/checkout-2/docs/payment-methods-list#preloading-components-using-preload-option" />
        </div>

        <div className="flex gap-2">
          {preload.length > 0 &&
            preload.map((component) => (
              <span key={component} className="px-2 py-1 bg-gray-200 rounded">
                {component}
              </span>
            ))}
          {preload.length === 0 && <span>None</span>}
        </div>
      </div>
      <div className="flex items-center gap-1">
        <Checkbox
          checked={selectedRefetch}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setSelectedRefetch(e.target.checked)
          }
          label="Refetch List Before Charge"
        />
        <InfoTooltip content="If enabled, the checkout will refetch the list session before processing a charge to ensure the latest data is used." />
        <ExternalLink link="https://checkoutdocs.payoneer.com/checkout-2/docs/basic-integration-checkout-web-sdk#refetch-the-list-before-charge" />
      </div>

      <Button onClick={handleSave} disabled={!hasChanges}>
        {checkoutLoading ? "Saving..." : "Save"}
      </Button>
      {checkoutError && <p style={{ color: "red" }}>{checkoutError}</p>}
    </div>
  );
};

export default SDKBaseConfiguration;
