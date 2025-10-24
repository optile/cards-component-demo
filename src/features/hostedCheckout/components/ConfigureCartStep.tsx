import React from "react";
import type { StepComponentProps } from "../../../components/ui/MultiStepper";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import Select from "../../../components/ui/Select";
import { useHostedConfigurationStore } from "../store/hostedConfigurationStore";
import { CURRENCY_OPTIONS } from "../../../constants";

const ConfigureCartStep: React.FC<StepComponentProps> = ({
  goToNext,
  goToPrevious,
  isFirstStep,
  isLastStep,
}) => {
  const { merchantCart, setMerchantCart } = useHostedConfigurationStore();

  const handleInputChange =
    (field: keyof typeof merchantCart) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (setMerchantCart) {
        const value =
          field === "amount" || field === "quantity"
            ? Number(e.target.value)
            : e.target.value;
        setMerchantCart({ [field]: value });
      }
    };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (setMerchantCart) {
      setMerchantCart({ currency: e.target.value });
    }
  };

  const currencyOptions = CURRENCY_OPTIONS;

  return (
    <div className="p-6 bg-white rounded-lg shadow-sm border">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">Configure Cart</h2>
      <p className="text-gray-600 mb-6">
        Set up your merchant cart details for the checkout process.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <Input
          type="text"
          value={merchantCart.itemName}
          onChange={handleInputChange("itemName")}
          label="Item Name"
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />

        <Input
          type="number"
          value={merchantCart.amount}
          onChange={handleInputChange("amount")}
          label="Amount"
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />

        <Select
          value={merchantCart.currency}
          onChange={handleSelectChange}
          options={currencyOptions}
          label="Currency"
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />

        <Input
          type="number"
          value={merchantCart.quantity}
          onChange={handleInputChange("quantity")}
          label="Quantity"
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div className="flex justify-between">
        <Button
          onClick={goToPrevious}
          disabled={isFirstStep}
          variant="secondary"
          className="text-gray-600 border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </Button>
        <Button
          onClick={goToNext}
          disabled={isLastStep}
          variant="primary"
          className="px-6 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </Button>
      </div>
    </div>
  );
};

export default ConfigureCartStep;
