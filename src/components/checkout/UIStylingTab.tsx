import React from "react";
import { useConfigurationStore } from "../../store/configuration";
import RadioGroup from "../ui/RadioGroup";
import ColorPicker from "../ui/ColorPicker";
import InfoTooltip from "../ui/InfoTooltip";

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
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-1">
          <h3 className="font-semibold">Payment button type:</h3>
          <InfoTooltip content="Choose between the default payment button provided by the SDK or a custom button that you can style and position as you like." />
        </div>
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
