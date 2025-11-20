import React, { useState, useEffect } from "react";
import { useConfigurationStore } from "@/features/embeddedCheckout/store/configurationStore";
import { useCheckoutStore } from "@/features/embeddedCheckout/store/checkoutStore";
import { buildListSessionUpdates } from "@/features/embeddedCheckout/utils/checkoutUtils";
import { CURRENCY_OPTIONS } from "@/constants";
import type { CartProduct } from "@/types/merchant";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";

const MerchantStoreCartTab: React.FC = () => {
  const {
    merchantCart: { products, currency },
    setMerchantCart,
  } = useConfigurationStore();
  const { updateListSession, env, listSessionData } = useCheckoutStore();
  const [localProducts, setLocalProducts] = useState<CartProduct[]>(products);
  const [localCurrency, setLocalCurrency] = useState(currency);

  useEffect(() => {
    setLocalProducts(products);
  }, [products]);

  useEffect(() => {
    setLocalCurrency(currency);
  }, [currency]);

  const hasChanges =
    JSON.stringify(localProducts) !== JSON.stringify(products) ||
    localCurrency !== currency;

  const handleSave = async () => {
    setMerchantCart({
      products: localProducts,
      currency: localCurrency,
    });
    if (!listSessionData) return;
    const { billingAddress, shippingAddress, sameAddress } =
      useConfigurationStore.getState();
    const updates = buildListSessionUpdates(
      {
        products: localProducts,
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
    setLocalProducts(products);
    setLocalCurrency(currency);
  };

  const handleAddProduct = () => {
    setLocalProducts([
      ...localProducts,
      { name: "", price: 0, quantity: 1 },
    ]);
  };

  const handleRemoveProduct = (index: number) => {
    setLocalProducts(localProducts.filter((_, i) => i !== index));
  };

  const handleProductChange = (
    index: number,
    field: keyof CartProduct,
    value: string | number
  ) => {
    setLocalProducts(
      localProducts.map((product, i) =>
        i === index ? { ...product, [field]: value } : product
      )
    );
  };

  const calculateTotal = () => {
    return localProducts.reduce(
      (total, product) => total + product.price * product.quantity,
      0
    );
  };

  const currencies = CURRENCY_OPTIONS;

  return (
    <div>
      <div className="mb-4">
        <Select
          value={localCurrency}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
            setLocalCurrency(e.target.value)
          }
          options={currencies}
          label="Currency"
          id="currency"
        />
      </div>

      <div className="mb-4">
        <h3 className="text-sm font-semibold mb-2">Products</h3>
        {localProducts.map((product, index) => (
          <div key={index} className="mb-4 p-4 border border-gray-300 rounded">
            <div className="mb-2">
              <Input
                type="text"
                value={product.name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handleProductChange(index, "name", e.target.value)
                }
                label="Product Name"
                id={`product-name-${index}`}
              />
            </div>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <Input
                type="number"
                value={product.price}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handleProductChange(index, "price", Number(e.target.value))
                }
                label="Price"
                id={`product-price-${index}`}
              />
              <Input
                type="number"
                value={product.quantity}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handleProductChange(index, "quantity", Number(e.target.value))
                }
                label="Quantity"
                id={`product-quantity-${index}`}
              />
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">
                Line Total: {localCurrency} {(product.price * product.quantity).toFixed(2)}
              </span>
              {localProducts.length > 1 && (
                <Button
                  onClick={() => handleRemoveProduct(index)}
                  variant="secondary"
                >
                  Remove
                </Button>
              )}
            </div>
          </div>
        ))}
        <Button onClick={handleAddProduct} variant="secondary" className="mb-4">
          Add Product
        </Button>
      </div>

      <div className="mb-4 p-4 bg-gray-100 rounded">
        <div className="flex justify-between items-center">
          <span className="font-semibold">Total Amount:</span>
          <span className="text-lg font-bold">
            {localCurrency} {calculateTotal().toFixed(2)}
          </span>
        </div>
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
