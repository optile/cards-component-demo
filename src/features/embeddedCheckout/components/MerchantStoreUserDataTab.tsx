import React, { useState, useEffect } from "react";
import { useConfigurationStore } from "../store/configurationStore";
import { useCheckoutStore } from "../store/checkoutStore";
import { buildListSessionUpdates } from "../utils/checkoutUtils";
import AddressForm, { type Address } from "./AddressForm";
import Checkbox from "../../../components/ui/Checkbox";
import Button from "../../../components/ui/Button";

const MerchantStoreUserDataTab: React.FC = () => {
  const {
    billingAddress,
    setBillingAddress,
    shippingAddress,
    setShippingAddress,
    sameAddress,
    setSameAddress,
  } = useConfigurationStore();
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

  const hasChanges =
    JSON.stringify(localBilling) !== JSON.stringify(billingAddress) ||
    JSON.stringify(localShipping) !== JSON.stringify(shippingAddress) ||
    localSameAddress !== sameAddress;

  const handleSave = async () => {
    setBillingAddress(localBilling);
    setShippingAddress(localShipping);
    setSameAddress(localSameAddress);
    const { updateListSession, env, listSessionData } =
      useCheckoutStore.getState();
    if (!listSessionData) return;
    const { merchantCart } = useConfigurationStore.getState();
    const updates = buildListSessionUpdates(
      merchantCart,
      localBilling,
      localShipping,
      localSameAddress,
      env
    );
    await updateListSession(
      updates,
      listSessionData.id,
      listSessionData.transactionId
    );
  };

  const handleCancel = () => {
    setLocalBilling(billingAddress);
    setLocalShipping(shippingAddress);
    setLocalSameAddress(sameAddress);
  };

  const handleBillingChange = (field: keyof Address, value: string) => {
    setLocalBilling({ ...localBilling, [field]: value });
  };

  const handleShippingChange = (field: keyof Address, value: string) => {
    setLocalShipping({ ...localShipping, [field]: value });
  };

  return (
    <div>
      <AddressForm
        address={localBilling}
        onChange={handleBillingChange}
        title="Billing Address"
        showEmail={true}
      />

      <div className="mb-4">
        <Checkbox
          checked={localSameAddress}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setLocalSameAddress(e.target.checked)
          }
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

export default MerchantStoreUserDataTab;
