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
import { useCheckoutStore } from "../store/checkoutStore";

const Checkout = () => {
  const { listSessionData } = useInitSession();
  const { version } = useCheckoutStore();
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
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">Checkout page</h1>
          <p className="text-sm text-gray-500 mt-2">
            SDK Version: {version} (from CDN)
          </p>
        </div>

        {/* Flow Explanation Section - Placeholder for Chloe's content */}
        <div className="max-w-4xl mx-auto mb-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-blue-900 mb-3">
            About Embedded Checkout Flow
          </h2>
          <div className="text-sm text-blue-800 space-y-2">
            <p>
              The Embedded Checkout integration allows you to render Payoneer
              payment components directly within your application, providing a
              seamless user experience without redirecting customers away from
              your site.
            </p>
            <p>
              Use the configuration panel below to customize SDK behavior, test
              different callback implementations, modify cart and customer data,
              and adjust UI styling. All changes are applied in real-time and
              can be shared via URL.
            </p>
          </div>
        </div>

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
