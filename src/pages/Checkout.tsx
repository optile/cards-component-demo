import DemoCardNumbers from "../components/DemoCardNumbers";
import ConfigurationPanel from "../components/checkout/ConfigurationPanel";
import PaymentMethodsSection from "../components/checkout/PaymentMethodsSection";
import ShoppingCartSection from "../components/checkout/ShoppingCartSection";
import { useCheckoutSession } from "../hooks/useCheckoutSession";
import { usePayoneerCheckout } from "../hooks/usePayoneerCheckout";
import { usePaymentMethods } from "../hooks/usePaymentMethods";
import { useConfigurationStore } from "../store/configuration";

const Checkout = () => {
  const { listSessionData } = useCheckoutSession();
  const { checkout } = usePayoneerCheckout(listSessionData);
  const {
    payButtonType,
    primaryColor,
    primaryTextColor,
    merchantCart: { amount, itemName, quantity, currency },
  } = useConfigurationStore();
  const {
    activeNetwork,
    setActiveNetwork,
    componentRefs,
    handlePayment,
    availableMethods,
    isSubmitting,
  } = usePaymentMethods(checkout);

  const getCurrencySymbol = (curr: string) => {
    const symbols: { [key: string]: string } = {
      USD: "$",
      EUR: "€",
      GBP: "£",
      CNY: "¥",
      JPY: "¥",
      RUB: "₽",
    };
    return symbols[curr] || "$";
  };

  return (
    <div className="bg-gray-50 min-h-screen font-sans">
      <div className="mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-center mb-8">Checkout page</h1>
        <ConfigurationPanel />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="md:col-span-2">
            <PaymentMethodsSection
              availableMethods={availableMethods}
              activeNetwork={activeNetwork}
              setActiveNetwork={setActiveNetwork}
              componentRefs={componentRefs}
              payButtonType={payButtonType}
              primaryColor={primaryColor}
              primaryTextColor={primaryTextColor}
              handlePayment={handlePayment}
              isSubmitting={isSubmitting}
            />
          </div>

          {/* Right Column */}
          <ShoppingCartSection
            itemName={itemName}
            quantity={quantity}
            currency={currency}
            amount={amount}
            getCurrencySymbol={getCurrencySymbol}
          />
        </div>
      </div>
      <DemoCardNumbers />
    </div>
  );
};

export default Checkout;
