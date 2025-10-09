import DemoCardNumbers from "../components/checkout/DemoCardNumbers";
import ConfigurationPanel from "../components/checkout/ConfigurationPanel";
import PaymentMethodsSection from "../components/checkout/PaymentMethodsSection";
import ShoppingCartSection from "../components/checkout/ShoppingCartSection";
import { useInitSession } from "../hooks/useInitSession";
import { useInitCheckout } from "../hooks/useInitCheckout";
import { usePaymentMethods } from "../hooks/usePaymentMethods";
import { useConfigurationStore } from "../store/configuration";

const Checkout = () => {
  const { listSessionData } = useInitSession();
  const { checkout } = useInitCheckout(listSessionData);
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

  return (
    <div className="bg-gray-50 min-h-screen font-sans">
      <div className="mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-center mb-8">Checkout page</h1>
        <ConfigurationPanel />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
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

          <ShoppingCartSection
            itemName={itemName}
            quantity={quantity}
            currency={currency}
            amount={amount}
          />
        </div>
      </div>
      <DemoCardNumbers />
    </div>
  );
};

export default Checkout;
