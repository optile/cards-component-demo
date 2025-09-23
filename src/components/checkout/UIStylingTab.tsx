import React from "react";
import { useConfigurationStore } from "../../store/configuration";

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
        <div className="flex items-center gap-4">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="radio"
              name="payButtonType"
              value="default"
              checked={payButtonType === "default"}
              onChange={() => setPayButtonType("default")}
              className="form-radio h-4 w-4 text-blue-600"
            />
            <span>Default pay button</span>
          </label>
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="radio"
              name="payButtonType"
              value="custom"
              checked={payButtonType === "custom"}
              onChange={() => setPayButtonType("custom")}
              className="form-radio h-4 w-4 text-blue-600"
            />
            <span>Custom pay button</span>
          </label>
        </div>
      </div>
      <div>
        <h3 className="font-semibold mb-2">Styling</h3>
        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            <label htmlFor="primaryColor" className="mb-1 text-sm">
              Primary color
            </label>
            <input
              id="primaryColor"
              type="color"
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
              className="w-16 h-8 border-none cursor-pointer"
            />
          </div>
          <div className="flex flex-col">
            <label htmlFor="primaryTextColor" className="mb-1 text-sm">
              Primary text color
            </label>
            <input
              id="primaryTextColor"
              type="color"
              value={primaryTextColor}
              onChange={(e) => setPrimaryTextColor(e.target.value)}
              className="w-16 h-8 border-none cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default UIStylingTab;
