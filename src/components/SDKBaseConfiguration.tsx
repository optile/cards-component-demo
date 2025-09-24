import React, { useState, useEffect } from "react";
import { Divisions } from "../constants/checkout";
import { useCheckoutStore } from "../store/checkoutStore";
import Select from "./ui/Select";
import Button from "./ui/Button";
import Checkbox from "./ui/Checkbox";

const SDKBaseConfiguration: React.FC = () => {
  const {
    env,
    preload,
    refetchListBeforeCharge,
    updateEnvironment,
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
    if (selectedEnv !== env) {
      await updateEnvironment(selectedEnv);
    }
  };

  const envOptions = Object.keys(Divisions).map((envKey) => ({
    value: envKey,
    label: envKey,
  }));

  return (
    <div className="flex flex-col gap-4">
      <h3>SDK Base Configuration</h3>
      <Select
        label="Environment:"
        value={selectedEnv}
        onChange={(e) => setSelectedEnv(e.target.value)}
        options={envOptions}
        id="env-select"
      />
      <div className="flex flex-col gap-2">
        <label>Preloaded Components:</label>
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
      <Checkbox
        checked={selectedRefetch}
        onChange={(e) => setSelectedRefetch(e.target.checked)}
        label="Refetch List Before Charge"
      />
      <Button onClick={handleSave} disabled={!hasChanges}>
        {checkoutLoading ? "Saving..." : "Save"}
      </Button>
      {checkoutError && <p style={{ color: "red" }}>{checkoutError}</p>}
    </div>
  );
};

export default SDKBaseConfiguration;
