import React, { useState, useEffect } from "react";
import { useConfigurationStore } from "../../store/configuration";

const MerchantStoreCartTab: React.FC = () => {
  const {
    merchantCart: { amount, itemName, quantity, currency },
    setMerchantCart,
  } = useConfigurationStore();
  const [localAmount, setLocalAmount] = useState(amount);
  const [localItemName, setLocalItemName] = useState(itemName);
  const [localQuantity, setLocalQuantity] = useState(quantity);
  const [localCurrency, setLocalCurrency] = useState(currency);

  useEffect(() => {
    setLocalAmount(amount);
  }, [amount]);

  useEffect(() => {
    setLocalItemName(itemName);
  }, [itemName]);

  useEffect(() => {
    setLocalQuantity(quantity);
  }, [quantity]);

  useEffect(() => {
    setLocalCurrency(currency);
  }, [currency]);

  const hasChanges =
    localAmount !== amount ||
    localItemName !== itemName ||
    localQuantity !== quantity ||
    localCurrency !== currency;

  const handleSave = () => {
    setMerchantCart({
      amount: localAmount,
      itemName: localItemName,
      quantity: localQuantity,
      currency: localCurrency,
    });
  };

  const handleCancel = () => {
    setLocalAmount(amount);
    setLocalItemName(itemName);
    setLocalQuantity(quantity);
    setLocalCurrency(currency);
  };

  return (
    <div>
      <div className="mb-4">
        <label
          htmlFor="itemName"
          className="block text-sm font-medium text-gray-700"
        >
          Item Name
        </label>
        <input
          type="text"
          id="itemName"
          value={localItemName}
          onChange={(e) => setLocalItemName(e.target.value)}
          className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        />
      </div>
      <div className="mb-4">
        <label
          htmlFor="amount"
          className="block text-sm font-medium text-gray-700"
        >
          Amount
        </label>
        <input
          type="number"
          id="amount"
          value={localAmount}
          onChange={(e) => setLocalAmount(Number(e.target.value))}
          className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        />
      </div>
      <div className="mb-4">
        <label
          htmlFor="currency"
          className="block text-sm font-medium text-gray-700"
        >
          Currency
        </label>
        <select
          id="currency"
          value={localCurrency}
          onChange={(e) => setLocalCurrency(e.target.value)}
          className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        >
          <option value="USD">USD</option>
          <option value="EUR">EUR</option>
          <option value="GBP">GBP</option>
          <option value="CNY">Chinese Yuan</option>
          <option value="JPY">Japanese Yen</option>
          <option value="RUB">Russian Ruble</option>
        </select>
      </div>
      <div className="flex gap-2">
        <button
          onClick={handleSave}
          disabled={!hasChanges}
          className={`px-4 py-2 rounded-md ${
            hasChanges
              ? "bg-blue-600 text-white hover:bg-blue-700"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
        >
          Save
        </button>
        <button
          onClick={handleCancel}
          disabled={!hasChanges}
          className={`px-4 py-2 rounded-md ${
            hasChanges
              ? "bg-gray-600 text-white hover:bg-gray-700"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default MerchantStoreCartTab;
