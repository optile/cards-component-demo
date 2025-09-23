import React, { useState, useEffect } from "react";
import { useConfigurationStore } from "../../store/configuration";

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

  const handleSave = () => {
    setBillingAddress(localBilling);
    setShippingAddress(localShipping);
    setSameAddress(localSameAddress);
  };

  const handleCancel = () => {
    setLocalBilling(billingAddress);
    setLocalShipping(shippingAddress);
    setLocalSameAddress(sameAddress);
  };

  const countries = [
    { value: "US", label: "United States" },
    { value: "GB", label: "United Kingdom" },
    { value: "CA", label: "Canada" },
    { value: "DE", label: "Germany" },
    // Add more as needed
  ];

  return (
    <div>
      <h3 className="text-lg font-medium mb-4">Billing Address</h3>
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <label
            htmlFor="billing-first-name"
            className="block text-sm font-medium text-gray-700"
          >
            First Name
          </label>
          <input
            type="text"
            id="billing-first-name"
            value={localBilling.firstName}
            onChange={(e) =>
              setLocalBilling({ ...localBilling, firstName: e.target.value })
            }
            className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>
        <div>
          <label
            htmlFor="billing-last-name"
            className="block text-sm font-medium text-gray-700"
          >
            Last Name
          </label>
          <input
            type="text"
            id="billing-last-name"
            value={localBilling.lastName}
            onChange={(e) =>
              setLocalBilling({ ...localBilling, lastName: e.target.value })
            }
            className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>
        <div>
          <label
            htmlFor="billing-email"
            className="block text-sm font-medium text-gray-700"
          >
            Email
          </label>
          <input
            type="email"
            id="billing-email"
            value={localBilling.email}
            onChange={(e) =>
              setLocalBilling({ ...localBilling, email: e.target.value })
            }
            className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>
        <div>
          <label
            htmlFor="billing-phone"
            className="block text-sm font-medium text-gray-700"
          >
            Phone
          </label>
          <input
            type="tel"
            id="billing-phone"
            value={localBilling.phone}
            onChange={(e) =>
              setLocalBilling({ ...localBilling, phone: e.target.value })
            }
            className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>
        <div>
          <label
            htmlFor="billing-street"
            className="block text-sm font-medium text-gray-700"
          >
            Street
          </label>
          <input
            type="text"
            id="billing-street"
            value={localBilling.street}
            onChange={(e) =>
              setLocalBilling({ ...localBilling, street: e.target.value })
            }
            className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>
        <div>
          <label
            htmlFor="billing-house-number"
            className="block text-sm font-medium text-gray-700"
          >
            House Number
          </label>
          <input
            type="text"
            id="billing-house-number"
            value={localBilling.houseNumber}
            onChange={(e) =>
              setLocalBilling({ ...localBilling, houseNumber: e.target.value })
            }
            className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>
        <div>
          <label
            htmlFor="billing-zip"
            className="block text-sm font-medium text-gray-700"
          >
            ZIP
          </label>
          <input
            type="text"
            id="billing-zip"
            value={localBilling.zip}
            onChange={(e) =>
              setLocalBilling({ ...localBilling, zip: e.target.value })
            }
            className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>
        <div>
          <label
            htmlFor="billing-city"
            className="block text-sm font-medium text-gray-700"
          >
            City
          </label>
          <input
            type="text"
            id="billing-city"
            value={localBilling.city}
            onChange={(e) =>
              setLocalBilling({ ...localBilling, city: e.target.value })
            }
            className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>
        <div>
          <label
            htmlFor="billing-state"
            className="block text-sm font-medium text-gray-700"
          >
            State
          </label>
          <input
            type="text"
            id="billing-state"
            value={localBilling.state}
            onChange={(e) =>
              setLocalBilling({ ...localBilling, state: e.target.value })
            }
            className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>
        <div>
          <label
            htmlFor="billing-country"
            className="block text-sm font-medium text-gray-700"
          >
            Country
          </label>
          <select
            id="billing-country"
            value={localBilling.country}
            onChange={(e) =>
              setLocalBilling({ ...localBilling, country: e.target.value })
            }
            className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          >
            {countries.map((country) => (
              <option key={country.value} value={country.value}>
                {country.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mb-4">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={localSameAddress}
            onChange={(e) => setLocalSameAddress(e.target.checked)}
            className="form-checkbox h-4 w-4 text-indigo-600 transition duration-150 ease-in-out"
          />
          <span className="ml-2 text-sm text-gray-700">
            Shipping address same as billing
          </span>
        </label>
      </div>

      {!localSameAddress && (
        <>
          <h3 className="text-lg font-medium mb-4">Shipping Address</h3>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label
                htmlFor="shipping-first-name"
                className="block text-sm font-medium text-gray-700"
              >
                First Name
              </label>
              <input
                type="text"
                id="shipping-first-name"
                value={localShipping.firstName}
                onChange={(e) =>
                  setLocalShipping({
                    ...localShipping,
                    firstName: e.target.value,
                  })
                }
                className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            <div>
              <label
                htmlFor="shipping-last-name"
                className="block text-sm font-medium text-gray-700"
              >
                Last Name
              </label>
              <input
                type="text"
                id="shipping-last-name"
                value={localShipping.lastName}
                onChange={(e) =>
                  setLocalShipping({
                    ...localShipping,
                    lastName: e.target.value,
                  })
                }
                className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            <div>
              <label
                htmlFor="shipping-phone"
                className="block text-sm font-medium text-gray-700"
              >
                Phone
              </label>
              <input
                type="tel"
                id="shipping-phone"
                value={localShipping.phone}
                onChange={(e) =>
                  setLocalShipping({ ...localShipping, phone: e.target.value })
                }
                className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            <div>
              <label
                htmlFor="shipping-street"
                className="block text-sm font-medium text-gray-700"
              >
                Street
              </label>
              <input
                type="text"
                id="shipping-street"
                value={localShipping.street}
                onChange={(e) =>
                  setLocalShipping({ ...localShipping, street: e.target.value })
                }
                className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            <div>
              <label
                htmlFor="shipping-house-number"
                className="block text-sm font-medium text-gray-700"
              >
                House Number
              </label>
              <input
                type="text"
                id="shipping-house-number"
                value={localShipping.houseNumber}
                onChange={(e) =>
                  setLocalShipping({
                    ...localShipping,
                    houseNumber: e.target.value,
                  })
                }
                className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            <div>
              <label
                htmlFor="shipping-zip"
                className="block text-sm font-medium text-gray-700"
              >
                ZIP
              </label>
              <input
                type="text"
                id="shipping-zip"
                value={localShipping.zip}
                onChange={(e) =>
                  setLocalShipping({ ...localShipping, zip: e.target.value })
                }
                className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            <div>
              <label
                htmlFor="shipping-city"
                className="block text-sm font-medium text-gray-700"
              >
                City
              </label>
              <input
                type="text"
                id="shipping-city"
                value={localShipping.city}
                onChange={(e) =>
                  setLocalShipping({ ...localShipping, city: e.target.value })
                }
                className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            <div>
              <label
                htmlFor="shipping-state"
                className="block text-sm font-medium text-gray-700"
              >
                State
              </label>
              <input
                type="text"
                id="shipping-state"
                value={localShipping.state}
                onChange={(e) =>
                  setLocalShipping({ ...localShipping, state: e.target.value })
                }
                className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            <div>
              <label
                htmlFor="shipping-country"
                className="block text-sm font-medium text-gray-700"
              >
                Country
              </label>
              <select
                id="shipping-country"
                value={localShipping.country}
                onChange={(e) =>
                  setLocalShipping({
                    ...localShipping,
                    country: e.target.value,
                  })
                }
                className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                {countries.map((country) => (
                  <option key={country.value} value={country.value}>
                    {country.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </>
      )}

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

export default MerchantStoreUserDataTab;
