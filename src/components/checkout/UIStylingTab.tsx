import React from "react";
import { useConfigurationStore } from "../../store/configuration";
import RadioGroup from "../ui/RadioGroup";
import ColorPicker from "../ui/ColorPicker";

const UIStylingTab: React.FC = () => {
  const {
    payButtonType,
    setPayButtonType,
    primaryColor,
    setPrimaryColor,
    primaryTextColor,
    setPrimaryTextColor,
  } = useConfigurationStore();

  return (
    <div>
      <div className="mb-4">
        <h3 className="font-semibold mb-2">Payment button type</h3>
        <RadioGroup
          name="payButtonType"
          options={[
            { value: "default", label: "Default pay button" },
            { value: "custom", label: "Custom pay button" },
          ]}
          selectedValue={payButtonType}
          onChange={(value) => setPayButtonType(value as "default" | "custom")}
        />
      </div>
      <div>
        <h3 className="font-semibold mb-2">Styling</h3>
        <div className="flex items-center gap-4">
          <ColorPicker
            value={primaryColor}
            onChange={setPrimaryColor}
            label="Primary color"
            id="primaryColor"
          />
          <ColorPicker
            value={primaryTextColor}
            onChange={setPrimaryTextColor}
            label="Primary text color"
            id="primaryTextColor"
          />
        </div>
      </div>
    </div>
  );
};

export default UIStylingTab;
