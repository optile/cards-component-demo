import React, { useState, useEffect } from "react";
import { useConfigurationStore } from "../store/configuration";

const MerchantStoreDataTab: React.FC = () => {
  const { merchantCart, setMerchantCart } = useConfigurationStore();
  const { amount, itemName, quantity } = merchantCart;
  const [localAmount, setLocalAmount] = useState(amount);
  const [localItemName, setLocalItemName] = useState(itemName);
  const [localQuantity, setLocalQuantity] = useState(quantity);

  useEffect(() => {
    setLocalAmount(amount);
  }, [amount]);

  useEffect(() => {
    setLocalItemName(itemName);
  }, [itemName]);

  useEffect(() => {
    setLocalQuantity(quantity);
  }, [quantity]);

  const handleSave = () => {
    setMerchantCart({
      amount: localAmount,
      itemName: localItemName,
      quantity: localQuantity,
    });
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
          htmlFor="quantity"
          className="block text-sm font-medium text-gray-700"
        >
          Quantity
        </label>
        <input
          type="number"
          id="quantity"
          value={localQuantity}
          onChange={(e) => setLocalQuantity(Number(e.target.value))}
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
      <button
        onClick={handleSave}
        className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
      >
        Save
      </button>
    </div>
  );
};

export default MerchantStoreDataTab;
