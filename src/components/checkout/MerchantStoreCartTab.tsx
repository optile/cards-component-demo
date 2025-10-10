import React, { useState, useEffect } from "react";
import { useConfigurationStore } from "../../store/configurationStore";
import { useCheckoutStore } from "../../store/checkoutStore";
import { buildListSessionUpdates } from "../../utils/checkoutUtils";
import Input from "../ui/Input";
import Select from "../ui/Select";
import Button from "../ui/Button";

const MerchantStoreCartTab: React.FC = () => {
  const {
    merchantCart: { amount, itemName, quantity, currency },
    setMerchantCart,
  } = useConfigurationStore();
  const { updateListSession, env, listSessionData } = useCheckoutStore();
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

  const handleSave = async () => {
    setMerchantCart({
      amount: localAmount,
      itemName: localItemName,
      quantity: localQuantity,
      currency: localCurrency,
    });
    if (!listSessionData) return;
    const { billingAddress, shippingAddress, sameAddress } =
      useConfigurationStore.getState();
    const updates = buildListSessionUpdates(
      {
        amount: localAmount,
        itemName: localItemName,
        quantity: localQuantity,
        currency: localCurrency,
      },
      billingAddress,
      shippingAddress,
      sameAddress,
      env
    );
    await updateListSession(
      updates,
      listSessionData.id,
      listSessionData.transactionId
    );
  };

  const handleCancel = () => {
    setLocalAmount(amount);
    setLocalItemName(itemName);
    setLocalQuantity(quantity);
    setLocalCurrency(currency);
  };

  const currencies = [
    { value: "USD", label: "USD" },
    { value: "EUR", label: "EUR" },
    { value: "GBP", label: "GBP" },
    { value: "CNY", label: "Chinese Yuan" },
    { value: "JPY", label: "Japanese Yen" },
    { value: "RUB", label: "Russian Ruble" },
  ];

  return (
    <div>
      <div className="mb-4">
        <Input
          type="text"
          value={localItemName}
          onChange={(e) => setLocalItemName(e.target.value)}
          label="Item Name"
          id="itemName"
        />
      </div>
      <div className="mb-4">
        <Input
          type="number"
          value={localAmount}
          onChange={(e) => setLocalAmount(Number(e.target.value))}
          label="Amount"
          id="amount"
        />
      </div>
      <div className="mb-4">
        <Select
          value={localCurrency}
          onChange={(e) => setLocalCurrency(e.target.value)}
          options={currencies}
          label="Currency"
          id="currency"
        />
      </div>
      <div className="flex gap-2">
        <Button onClick={handleSave} disabled={!hasChanges} variant="primary">
          Save
        </Button>
        <Button
          onClick={handleCancel}
          disabled={!hasChanges}
          variant="secondary"
        >
          Cancel
        </Button>
      </div>
    </div>
  );
};

export default MerchantStoreCartTab;
