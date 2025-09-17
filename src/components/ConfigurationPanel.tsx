import React from "react";
import { useConfigurationStore } from "../store/configuration";

const ConfigurationPanel: React.FC = () => {
  const {
    payButtonType,
    setPayButtonType,
    primaryColor,
    setPrimaryColor,
    primaryTextColor,
    setPrimaryTextColor,
    amount,
    setAmount,
  } = useConfigurationStore();

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mt-8">
      <h2 className="text-xl font-semibold mb-4 border-b pb-2">
        Configuration
      </h2>
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
      <div>
        <label
          htmlFor="amount"
          className="block text-sm font-medium text-gray-700"
        >
          Amount
        </label>
        <input
          type="number"
          id="amount"
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
          className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        />
      </div>
    </div>
  );
};

export default ConfigurationPanel;
