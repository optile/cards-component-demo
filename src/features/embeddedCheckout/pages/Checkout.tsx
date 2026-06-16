import { useParams, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import DemoCardNumbers from "@/features/embeddedCheckout/components/DemoCardNumbers";
import ConfigurationPanel from "@/features/embeddedCheckout/components/ConfigurationPanel";
import PaymentMethodsSection from "@/features/embeddedCheckout/components/PaymentMethodsSection";
import ShoppingCartSection from "@/features/embeddedCheckout/components/ShoppingCartSection";
import { useInitSession } from "@/features/embeddedCheckout/hooks/useInitSession";
import { useInitCheckout } from "@/features/embeddedCheckout/hooks/useInitCheckout";
import { usePaymentMethods } from "@/features/embeddedCheckout/hooks/usePaymentMethods";
import { useConfigurationStore } from "@/features/embeddedCheckout/store/configurationStore";
import ChargeFlowEventLogger from "../components/ChargeFlowEventLogger";
import { useCheckoutStore } from "../store/checkoutStore";
import Icon from "@/components/ui/Icon";
import Tooltip from "@/components/ui/Tooltip";
import styles from "./Checkout.module.css";
import { registrationOptions, Registrations, type RegistrationType } from "@/constants/registrations";

const Checkout = () => {
  const { env } = useParams<{ env: string }>();
  const navigate = useNavigate();

  // Validate and set environment from URL params
  useEffect(() => {
    if (!env || (env !== "sandbox" && env !== "integration")) {
      console.error(`Invalid environment: ${env}. Redirecting to environment selection.`);
      navigate("/embedded");
      return;
    }

    // Set environment in store
    useCheckoutStore.setState({ env });
    console.log(`[Checkout] Environment set to: ${env}`);
  }, [env, navigate]);

  const { listSessionData } = useInitSession();
  const { version, reinitRegistrationSession, loadingCheckoutConfiguration } = useCheckoutStore();
  const { checkout } = useInitCheckout(listSessionData);
  const {
    payButtonType,
    primaryColor,
    primaryTextColor,
    merchantCart: { products, currency },
    registrationType,
    setRegistrationType
  } = useConfigurationStore();
  const {
    activeNetwork,
    setActiveNetwork,
    componentRefs,
    handlePayment,
    availableMethods,
    isSubmitting,
  } = usePaymentMethods(checkout);

  const handleRegistrationChange = async (registrationType: RegistrationType) => {
    if (setRegistrationType) {
      setRegistrationType(registrationType);
      reinitRegistrationSession(registrationType);
    }
  }

  return (
    <div className="bg-gray-50 min-h-screen font-sans">
      <a
        href="/cards-component-demo/embedded"
        className="inline-block m-4 px-4 py-2 rounded-md bg-gray-600 text-white hover:bg-gray-700 no-underline"
      >
        &larr; Back to Environment Selection
      </a>
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
            <div className="flex gap-1 border-b border-[#e5e5e0]">
              {Object.values(registrationOptions).map((regOption) => (
                <button
                  key={regOption.key}
                  className={`${styles.tab} ${registrationType === regOption.key ? styles.tabActive : ""}`}
                  onClick={() => handleRegistrationChange(regOption.key)}
                >
                  {regOption?.note ? (
                    <Tooltip content={regOption.note} childClassName="items-center">
                      {regOption.title}
                      <Icon
                        name="info"
                        size={14}
                        className="flex flex-inline ml-1 justify-center"
                      />
                    </Tooltip>
                  ) : (
                    regOption.title
                  )}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 cursor-pointer select-none">
            </div>

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
              loadingCheckoutConfiguration={loadingCheckoutConfiguration}
            />
            </div>
          <ShoppingCartSection
            products={products}
            currency={currency}
          />
        </div>
      </div>
      <DemoCardNumbers />
      <ChargeFlowEventLogger />
    </div>
  );
};

export default Checkout;
