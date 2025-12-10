import React, { useState } from "react";
import type { StepComponentProps } from "@/components/ui/MultiStepper";
import type { CartProduct } from "@/types/merchant";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import { useHostedConfigurationStore } from "@/features/hostedCheckout/store/hostedConfigurationStore";
import { CURRENCY_OPTIONS } from "@/constants";

const ConfigureCartStep: React.FC<StepComponentProps> = ({
  goToNext,
  goToPrevious,
  isFirstStep,
  isLastStep,
}) => {
  const { merchantCart, setMerchantCart } = useHostedConfigurationStore();
  const [localProducts, setLocalProducts] = useState<CartProduct[]>(
    merchantCart.products
  );

  const handleCurrencyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (setMerchantCart) {
      setMerchantCart({ currency: e.target.value });
    }
  };

  const handleProductChange = (
    index: number,
    field: keyof CartProduct,
    value: string | number
  ) => {
    const updatedProducts = localProducts.map((product, i) =>
      i === index ? { ...product, [field]: value } : product
    );
    setLocalProducts(updatedProducts);
    if (setMerchantCart) {
      setMerchantCart({ products: updatedProducts });
    }
  };

  const handleAddProduct = () => {
    const newProducts = [
      ...localProducts,
      { name: "", price: 0, quantity: 1 },
    ];
    setLocalProducts(newProducts);
    if (setMerchantCart) {
      setMerchantCart({ products: newProducts });
    }
  };

  const handleRemoveProduct = (index: number) => {
    const updatedProducts = localProducts.filter((_, i) => i !== index);
    setLocalProducts(updatedProducts);
    if (setMerchantCart) {
      setMerchantCart({ products: updatedProducts });
    }
  };

  const calculateTotal = () => {
    return localProducts.reduce(
      (total, product) => total + product.price * product.quantity,
      0
    );
  };

  const currencyOptions = CURRENCY_OPTIONS;

  return (
    <div className="p-6 bg-white rounded-lg shadow-sm border">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">Configure Cart</h2>
      <p className="text-gray-600 mb-6">
        Set up your merchant cart details for the checkout process.
      </p>

      <div className="mb-6">
        <Select
          value={merchantCart.currency}
          onChange={handleCurrencyChange}
          options={currencyOptions}
          label="Currency"
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-4">Products</h3>
        {localProducts.map((product, index) => (
          <div
            key={index}
            className="mb-4 p-4 border border-gray-300 rounded-lg"
          >
            <div className="mb-3">
              <Input
                type="text"
                value={product.name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handleProductChange(index, "name", e.target.value)
                }
                label="Product Name"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="grid grid-cols-2 gap-4 mb-3">
              <Input
                type="number"
                value={product.price}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handleProductChange(index, "price", Number(e.target.value))
                }
                label="Price"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <Input
                type="number"
                value={product.quantity}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handleProductChange(index, "quantity", Number(e.target.value))
                }
                label="Quantity"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">
                Line Total: {merchantCart.currency}{" "}
                {(product.price * product.quantity).toFixed(2)}
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
        <Button
          onClick={handleAddProduct}
          variant="secondary"
          className="mb-4"
        >
          Add Product
        </Button>
      </div>

      <div className="mb-6 p-4 bg-gray-100 rounded-lg">
        <div className="flex justify-between items-center">
          <span className="font-semibold">Total Amount:</span>
          <span className="text-lg font-bold">
            {merchantCart.currency} {calculateTotal().toFixed(2)}
          </span>
        </div>
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
