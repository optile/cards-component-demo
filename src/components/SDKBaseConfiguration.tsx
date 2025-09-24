import React, { useState } from "react";
import { Divisions } from "../constants/checkout";
import { useCheckoutStore } from "../store/checkoutStore";
import Select from "./ui/Select";
import Button from "./ui/Button";

const SDKBaseConfiguration: React.FC = () => {
  const { env, updateEnvironment, checkoutLoading, checkoutError } =
    useCheckoutStore();
  const [selectedEnv, setSelectedEnv] = useState(env);

  const handleSave = async () => {
    await updateEnvironment(selectedEnv);
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
      <Button onClick={handleSave} disabled={checkoutLoading}>
        {checkoutLoading ? "Saving..." : "Save"}
      </Button>
      {checkoutError && <p style={{ color: "red" }}>{checkoutError}</p>}
    </div>
  );
};

export default SDKBaseConfiguration;
