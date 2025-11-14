import { Link } from "react-router-dom";

const ChooseFlow = () => {
  return (
    <div className="flex flex-col space-y-4  justify-center items-center px-4">
      <div className="flex flex-col space-y-6 p-8 border rounded-lg shadow-lg bg-white max-w-2xl">
        <div className="text-center space-y-3">
          <h1 className="text-3xl font-bold text-gray-900">
            Payoneer Checkout Demo
          </h1>
          <p className="text-gray-600 text-base leading-relaxed">
            Welcome to the Payoneer Checkout Web SDK demonstration playground.
            This interactive demo allows you to explore and test both
            integration patterns offered by Payoneer Checkout against sandbox
            environments.
          </p>
          <p className="text-gray-600 text-base leading-relaxed">
            Configure SDK options, customize UI styling, test payment flows with
            demo card numbers, and observe real-time callback events. All
            configurations can be shared via URL for easy collaboration and
            debugging.
          </p>
        </div>

        <div className="border-t pt-6 space-y-6">
          <h2 className="text-xl font-semibold text-center text-gray-800">
            Choose Your Integration Type
          </h2>

          {/* Embedded Flow Option */}
          <div className="border border-blue-200 rounded-lg overflow-hidden hover:shadow-md transition">
            <div className="bg-blue-50 p-4 border-b border-blue-200">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">
                Embedded Checkout Flow
              </h3>
              <p className="text-sm text-blue-800 leading-relaxed">
                Render payment components directly within your application for a
                seamless user experience. Customize SDK behavior, test
                callbacks, modify cart and customer data, and adjust UI styling
                in real-time. Perfect for merchants who want full control over
                the payment experience.
              </p>
            </div>
            <Link
              to="/embedded"
              className="block px-6 py-3 bg-blue-600 text-white text-center hover:bg-blue-700 transition font-medium"
            >
              Try Embedded Flow →
            </Link>
          </div>

          {/* Hosted Flow Option */}
          <div className="border border-green-200 rounded-lg overflow-hidden hover:shadow-md transition">
            <div className="bg-green-50 p-4 border-b border-green-200">
              <h3 className="text-lg font-semibold text-green-900 mb-2">
                Hosted Checkout Flow
              </h3>
              <p className="text-sm text-green-800 leading-relaxed">
                Redirect customers to Payoneer's fully-managed payment page.
                This integration minimizes PCI compliance requirements and
                provides the quickest path to accepting payments. Configure your
                cart and customer details, then let Payoneer handle the payment
                securely.
              </p>
            </div>
            <Link
              to="/hosted"
              className="block px-6 py-3 bg-green-600 text-white text-center hover:bg-green-700 transition font-medium"
            >
              Try Hosted Flow →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChooseFlow;
