import { useState, useMemo } from "react";
import Button from "../ui/Button";
import Input from "../ui/Input";
import { DEMO_CARD_CATEGORIES } from "../../constants/demoCards";
import { copyCardNumberToClipboard } from "../../utils/clipboard";
import { filterCardCategories } from "../../utils/cardFilters";

export default function DemoCardNumbers() {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredCategories = useMemo(() => {
    return filterCardCategories(DEMO_CARD_CATEGORIES, searchTerm);
  }, [searchTerm]);

  const handleCopyCard = async (cardNumber: string) => {
    try {
      const digits = await copyCardNumberToClipboard(cardNumber);
      setCopied(digits);
      setTimeout(() => setCopied(null), 1400);
    } catch (error) {
      console.error("Failed to copy card number:", error);
    }
  };

  if (!open) {
    return (
      <Button
        onClick={() => setOpen(true)}
        className="fixed bottom-4 right-4 shadow-lg transition-colors"
        variant="primary"
      >
        Demo card numbers
      </Button>
    );
  }

  return (
    <div
      className="fixed bottom-4 right-4 bg-white p-4 pt-0 rounded-lg shadow-lg w-[32rem] max-h-[500px] overflow-auto"
      role="dialog"
      aria-label="Demo card numbers"
    >
      <div className="sticky top-0 bg-white pt-4 pb-3 border-b-2 mb-3">
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-lg font-semibold">Demo card numbers</h3>
          <Button
            onClick={() => setOpen(false)}
            variant="secondary"
            className="!p-1 !bg-transparent !text-gray-500 hover:!bg-gray-100 hover:!text-gray-800"
          >
            Close
          </Button>
        </div>

        <Input
          type="text"
          placeholder="Search by name or type..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div className="space-y-4">
        {filteredCategories.map((category) => (
          <div key={category.title}>
            <h4 className="text-sm font-medium text-gray-800 mb-2 border-b border-gray-200 pb-1">
              {category.title}
            </h4>
            <div className="space-y-2">
              {category.cards.map((card) => {
                const digits = card.number.replace(/\s+/g, "");
                const isCopied = copied === digits;
                return (
                  <div
                    key={card.name + card.number}
                    className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-b-0"
                  >
                    <div className="w-32 text-sm text-gray-700">
                      {card.name}
                    </div>

                    <div className="flex-1">
                      <div className="font-mono text-sm tracking-wider">
                        {card.number}
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        {card.note}
                      </div>
                    </div>

                    <div className="flex-shrink-0">
                      <Button
                        onClick={() => handleCopyCard(card.number)}
                        variant="secondary"
                        className="!px-3 !py-1 !text-sm border hover:!bg-gray-50 focus:!outline-none !bg-white !text-gray-700"
                      >
                        {isCopied ? "Copied" : "Copy"}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {filteredCategories.length === 0 && searchTerm && (
          <div className="text-center text-gray-500 py-4">
            No cards found matching "{searchTerm}"
          </div>
        )}
      </div>

      <p className="text-xs text-gray-500 mt-4 pt-3 border-t border-gray-200">
        Expiry, CVC and postal code can be any valid values unless noted.
      </p>
    </div>
  );
}
