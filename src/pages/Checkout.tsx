import DemoCardNumbers from "../components/DemoCardNumbers";
import ConfigurationPanel from "../components/ConfigurationPanel";
import {
  useCheckoutSession,
  usePayoneerCheckout,
  usePaymentMethods,
} from "../hooks/useCheckout";
import type { PaymentMethod } from "../types/checkout";
import { useConfigurationStore } from "../store/configuration";

const Checkout = () => {
  const { listSessionData } = useCheckoutSession();
  const { checkout } = usePayoneerCheckout(listSessionData);
  const { payButtonType, primaryColor, primaryTextColor, amount } =
    useConfigurationStore();
  const {
    activeNetwork,
    setActiveNetwork,
    componentRefs,
    handlePayment,
    availableMethods,
    isSubmitting,
  } = usePaymentMethods(checkout);

  return (
    <div className="bg-gray-50 min-h-screen font-sans">
      <div className="mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-center mb-8">Checkout page</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="md:col-span-2">
            <div className="bg-white p-6 rounded-lg shadow-md mb-6">
              <h2 className="text-xl font-semibold mb-4 border-b pb-2">
                Personal Details
              </h2>
              <div className="flex justify-between items-center">
                <p className="text-gray-600">
                  Alex Smith, alexsmith@example.com, +49 188299489
                </p>
                <span className="text-green-500">✔️</span>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md mb-6">
              <h2 className="text-xl font-semibold mb-4 border-b pb-2">
                Shipping details
              </h2>
              <div className="flex justify-between items-center">
                <p className="text-gray-600">
                  Bayern Street 5, 80336 Munich, Germany
                </p>
                <span className="text-green-500">✔️</span>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4 border-b pb-2">
                Payment methods
              </h2>
              <div className="flex flex-col gap-4">
                {availableMethods.map((method: PaymentMethod) => (
                  <div className="max-w-[500px]" key={method.name}>
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="radio"
                        name="paymentMethod"
                        className="form-radio h-5 w-5 text-blue-600"
                        checked={activeNetwork === method.name}
                        onChange={() => setActiveNetwork(method.name)}
                      />
                      <span className="font-medium">{method.label}</span>
                    </label>
                    <div
                      ref={(el: HTMLDivElement | null) => {
                        if (el) {
                          componentRefs.current[method.name] = el;
                        }
                      }}
                      className={`w-full ${
                        activeNetwork === method.name ? "block" : "hidden"
                      }`}
                    />
                  </div>
                ))}
              </div>
              {payButtonType === "custom" && (
                <button
                  style={{
                    color: primaryTextColor,
                    backgroundColor: primaryColor,
                  }}
                  onClick={handlePayment}
                  className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-md hover:bg-blue-700 transition-colors mt-6"
                >
                  {isSubmitting ? "Processing..." : "Pay"}
                </button>
              )}
            </div>
          </div>

          {/* Right Column */}
          <div className="md:col-span-1">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4 border-b pb-2">
                Shopping Cart
              </h2>
              <div className="flex justify-between mb-2">
                <span>Black Notebook #1</span>
                <span>Qty: 1 | ${amount}</span>
              </div>
              <div className="flex justify-between font-bold text-lg border-t pt-2">
                <span>Total</span>
                <span>${amount}</span>
              </div>
            </div>
            <ConfigurationPanel />
          </div>
        </div>
      </div>
      <DemoCardNumbers />
    </div>
  );
};

export default Checkout;
