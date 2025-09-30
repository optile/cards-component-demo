interface ShoppingCartSectionProps {
  itemName: string;
  quantity: number;
  currency: string;
  amount: number;
  getCurrencySymbol: (curr: string) => string;
}

const ShoppingCartSection = ({
  itemName,
  quantity,
  currency,
  amount,
  getCurrencySymbol,
}: ShoppingCartSectionProps) => (
  <div className="md:col-span-1">
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4 border-b pb-2">
        Shopping Cart
      </h2>
      <div className="flex justify-between mb-2">
        <span>{itemName}</span>
        <span>
          Qty: {quantity} | {getCurrencySymbol(currency)}
          {amount}
        </span>
      </div>
      <div className="flex justify-between font-bold text-lg border-t pt-2">
        <span>Total</span>
        <span>
          {getCurrencySymbol(currency)}
          {amount * quantity}
        </span>
      </div>
    </div>
  </div>
);

export default ShoppingCartSection;
