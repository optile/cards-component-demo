import Icon from "@/components/ui/Icon";

const Header = () => {
  return (
    <header className="bg-black text-white p-4 flex justify-between items-center min-h-[60px]">
      <img src="/payoneer-white-logo.svg" alt="Payoneer" className="h-[30px]" />
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
