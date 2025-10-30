import DemoCardNumbers from "@/features/embeddedCheckout/components/DemoCardNumbers";
import ConfigurationPanel from "@/features/embeddedCheckout/components/ConfigurationPanel";
import PaymentMethodsSection from "@/features/embeddedCheckout/components/PaymentMethodsSection";
import ShoppingCartSection from "@/features/embeddedCheckout/components/ShoppingCartSection";
import { useInitSession } from "@/features/embeddedCheckout/hooks/useInitSession";
import { useInitCheckout } from "@/features/embeddedCheckout/hooks/useInitCheckout";
import { usePaymentMethods } from "@/features/embeddedCheckout/hooks/usePaymentMethods";
import { useConfigurationStore } from "@/features/embeddedCheckout/store/configurationStore";
import Link from "@/components/ui/Link";
import ChargeFlowEventLogger from "../components/ChargeFlowEventLogger";

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
      <Link to="/" variant="secondary" className="m-4 z-50 top-0 left-0">
        &larr; Back to Flow Selection
      </Link>
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
      <ChargeFlowEventLogger />
    </div>
  );
};

export default Checkout;
