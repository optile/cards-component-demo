import React, { useEffect, useState } from "react";
import { useCheckoutStore } from "../../store/checkoutStore";
import { createEnvironmentOptions } from "../../utils";
import Button from "../ui/Button";
import Checkbox from "../ui/Checkbox";
import Select from "../ui/Select";
import InfoTooltip from "../ui/InfoTooltip";
import ExternalLink from "../ui/ExternalLink";

const SDKBaseConfiguration: React.FC = () => {
  const {
    env,
    preload,
    refetchListBeforeCharge,
    updateSdkConfig,
    checkoutLoading,
    checkoutError,
  } = useCheckoutStore();
  const [selectedEnv, setSelectedEnv] = useState(env);
  const [selectedRefetch, setSelectedRefetch] = useState(
    refetchListBeforeCharge
  );

  useEffect(() => {
    setSelectedEnv(env);
    setSelectedRefetch(refetchListBeforeCharge);
  }, [env, refetchListBeforeCharge]);

  const hasChanges =
    selectedEnv !== env || selectedRefetch !== refetchListBeforeCharge;

  const handleSave = async () => {
    // Update store
    useCheckoutStore.setState({ refetchListBeforeCharge: selectedRefetch });
    // Update env if changed

    await updateSdkConfig({
      env: selectedEnv,
      refetchListBeforeCharge: selectedRefetch,
    });
  };

  const envOptions = createEnvironmentOptions();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-1 items-center">
        <h3>SDK Base Configuration</h3>
        <ExternalLink link="https://checkoutdocs.payoneer.com/checkout-2/docs/basic-integration-checkout-web-sdk" />
      </div>
      <Select
        label="Environment:"
        value={selectedEnv}
        onChange={(e) => setSelectedEnv(e.target.value)}
        options={envOptions}
        id="env-select"
      />
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
          onChange={(e) => setSelectedRefetch(e.target.checked)}
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
