import Icon from "@/components/ui/Icon";
import { Link, useLocation } from "react-router-dom";
import payoneerLogo from "/payoneer-white-logo.svg";

const Header = () => {
  const location = useLocation();
  const isEmbedded = location.pathname.includes("/embedded");
  const isHosted = location.pathname.includes("/hosted");

  return (
    <header className="bg-black text-white p-4 fixed top-0 z-50 w-full flex justify-between items-center min-h-[60px]">
      <div className="flex items-center gap-6">
        <img src={payoneerLogo} alt="Payoneer" className="h-[30px]" />

        {/* Flow Switcher Tabs */}
        {(isEmbedded || isHosted) && (
          <div className="flex gap-2 border border-gray-600 rounded">
            <Link
              to="/embedded"
              className={`px-4 py-1.5 text-sm transition-colors ${
                isEmbedded
                  ? "bg-white text-black"
                  : "bg-transparent text-white hover:bg-gray-800"
              }`}
            >
              Embedded
            </Link>
            <Link
              to="/hosted"
              className={`px-4 py-1.5 text-sm transition-colors ${
                isHosted
                  ? "bg-white text-black"
                  : "bg-transparent text-white hover:bg-gray-800"
              }`}
            >
              Hosted
            </Link>
          </div>
        )}
      </div>

      <div className="flex gap-4">
        <h2 className="text-lg flex gap-1 items-center underline">
          <a
            href="https://checkoutdocs.payoneer.com/checkout-2/docs/basic-integration-checkout-web-sdk"
            target="_blank"
            rel="noopener noreferrer"
            className="flex gap-1 items-center "
          >
            Documentation{" "}
            <Icon
              name="external-link"
              size={16}
              className="text-gray-500 cursor-help"
            />
          </a>
        </h2>

        <h2 className="text-lg">Checkout V2</h2>
      </div>
    </header>
  );
};

export default Header;
