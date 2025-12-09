import Button from "@/components/ui/Button";

const SelectEnvironment = () => {
  const handleEnvironmentSelect = (env: string) => {
    // Use native navigation to force full page reload
    window.location.href = `/cards-component-demo/embedded/${env}`;
  };

  return (
    <div className="bg-gray-50 min-h-screen font-sans">
      <a
        href="/cards-component-demo/"
        className="inline-block m-4 px-4 py-2 rounded-md bg-gray-600 text-white hover:bg-gray-700 no-underline"
      >
        &larr; Back to Flow Selection
      </a>
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-3xl font-bold mb-2 text-center">
          Embedded Checkout
        </h1>
        <p className="text-gray-600 text-center mb-8">
          Select the environment for testing
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Sandbox Environment */}
          <div className="border-2 border-gray-200 rounded-lg p-6 hover:border-blue-500 transition-colors">
            <div className="mb-4">
              <h3 className="text-xl font-semibold mb-2">Sandbox</h3>
              <p className="text-gray-600 text-sm mb-4">
                Integration environment for pre-production testing.
              </p>
              <div className="bg-gray-50 p-3 rounded text-xs font-mono mb-4">
                <div className="text-gray-500">Division</div>
                <div className="font-semibold">17875</div>
              </div>
            </div>
            <Button
              onClick={() => handleEnvironmentSelect("sandbox")}
              className="w-full"
            >
              Use Sandbox
            </Button>
          </div>

          {/* Integration Environment */}
          <div className="border-2 border-gray-200 rounded-lg p-6 hover:border-blue-500 transition-colors">
            <div className="mb-4">
              <h3 className="text-xl font-semibold mb-2">
                Checkout Integration
              </h3>
              <p className="text-gray-600 text-sm mb-4">
                Test environment for development and integration testing.
              </p>

              <div className="bg-gray-50 p-3 rounded text-xs font-mono mb-4">
                <div className="text-gray-500">Division</div>
                <div className="font-semibold">45667</div>
              </div>
            </div>
            <Button
              onClick={() => handleEnvironmentSelect("checkout.integration")}
              className="w-full"
            >
              Use Integration
            </Button>
          </div>
        </div>

        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> Each environment has its own SDK version and
            configuration. You can switch between them by returning to this
            page.
          </p>
        </div>
      </div>
      </div>
    </div>
  );
};

export default SelectEnvironment;
