import type { PaymentMethod } from "../../types/checkout";
import Button from "../ui/Button";

interface PaymentMethodsSectionProps {
  availableMethods: PaymentMethod[];
  activeNetwork: string;
  setActiveNetwork: (network: string) => void;
  componentRefs: React.MutableRefObject<{
    [key: string]: HTMLDivElement | null;
  }>;
  payButtonType: string;
  primaryColor: string;
  primaryTextColor: string;
  handlePayment: () => void;
  isSubmitting: boolean;
}

const PaymentMethodsSection = ({
  availableMethods,
  activeNetwork,
  setActiveNetwork,
  componentRefs,
  payButtonType,
  primaryColor,
  primaryTextColor,
  handlePayment,
  isSubmitting,
}: PaymentMethodsSectionProps) => (
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
      <Button
        onClick={handlePayment}
        variant="custom"
        style={{
          color: primaryTextColor,
          backgroundColor: primaryColor,
        }}
      >
        {isSubmitting ? "Processing..." : "Pay"}
      </Button>
    )}
  </div>
);

export default PaymentMethodsSection;
