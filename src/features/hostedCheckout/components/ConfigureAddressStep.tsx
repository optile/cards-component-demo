import React, { useState, useEffect } from "react";
import type { StepComponentProps } from "@/components/ui/MultiStepper";
import Button from "@/components/ui/Button";
import AddressForm, {
  type Address,
} from "@/features/embeddedCheckout/components/AddressForm";
import Checkbox from "@/components/ui/Checkbox";
import { useHostedConfigurationStore } from "@/features/hostedCheckout/store/hostedConfigurationStore";

const ConfigureAddressStep: React.FC<StepComponentProps> = ({
  goToNext,
  goToPrevious,
  isFirstStep,
  isLastStep,
}) => {
  const {
    billingAddress,
    shippingAddress,
    sameAddress,
    setBillingAddress,
    setShippingAddress,
    setSameAddress,
  } = useHostedConfigurationStore();

  const [localBilling, setLocalBilling] = useState(billingAddress);
  const [localShipping, setLocalShipping] = useState(shippingAddress);
  const [localSameAddress, setLocalSameAddress] = useState(sameAddress);

  useEffect(() => {
    setLocalBilling(billingAddress);
  }, [billingAddress]);

  useEffect(() => {
    setLocalShipping(shippingAddress);
  }, [shippingAddress]);

  useEffect(() => {
    setLocalSameAddress(sameAddress);
  }, [sameAddress]);

  const handleNext = () => {
    if (setBillingAddress && setShippingAddress && setSameAddress) {
      setBillingAddress(localBilling);
      setSameAddress(localSameAddress);
      if (localSameAddress) {
        setShippingAddress(localBilling);
      } else {
        setShippingAddress(localShipping);
      }
    }
    goToNext();
  };

  const handleBillingChange = (field: keyof Address, value: string) => {
    const updatedBilling = { ...localBilling, [field]: value };
    setLocalBilling(updatedBilling);
    if (localSameAddress) {
      setLocalShipping(updatedBilling);
    }
  };

  const handleShippingChange = (field: keyof Address, value: string) => {
    setLocalShipping({ ...localShipping, [field]: value });
  };

  const handleSameAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setLocalSameAddress(checked);
    if (checked) {
      setLocalShipping(localBilling);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-sm border">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">
        Customer Information
      </h2>
      <p className="text-gray-600 mb-6">
        Configure billing and shipping address information.
      </p>

      <AddressForm
        address={localBilling}
        onChange={handleBillingChange}
        title="Billing Address"
        showEmail={true}
      />

      <div className="mb-4">
        <Checkbox
          checked={localSameAddress}
          onChange={handleSameAddressChange}
          label="Shipping address same as billing"
        />
      </div>

      {!localSameAddress && (
        <AddressForm
          address={localShipping}
          onChange={handleShippingChange}
          title="Shipping Address"
          showEmail={false}
        />
      )}

      <div className="flex justify-between mt-6">
        <Button
          onClick={goToPrevious}
          disabled={isFirstStep}
          variant="secondary"
          className="text-gray-600 border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </Button>
        <Button
          onClick={handleNext}
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

export default ConfigureAddressStep;
