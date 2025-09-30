import { useState } from "react";

const demoCards = [
  { name: "Mastercard", number: "5444 4444 4444 4445" },
  { name: "Visa", number: "4444 3333 2222 1111" },
  { name: "Amex", number: "3434 3434 3434 343" },
  { name: "Diners Club", number: "3614 8900 6479 13" },
  { name: "Discover", number: "6011 0004 0000 0000" },
];

const DemoCardNumbers = () => {
  const [isOpen, setIsOpen] = useState(false);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 bg-blue-600 text-white py-2 px-4 rounded-lg shadow-lg hover:bg-blue-700 transition-colors"
      >
        Demo card numbers
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white p-6 rounded-lg shadow-lg w-96">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Demo card numbers</h3>
        <button
          onClick={() => setIsOpen(false)}
          className="text-gray-500 hover:text-gray-800"
        >
          Close
        </button>
      </div>
      <table className="w-full text-left">
        <tbody>
          {demoCards.map((card) => (
            <tr key={card.name} className="border-b">
              <td className="py-2">{card.name}</td>
              <td className="py-2 font-mono">{card.number}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-xs text-gray-500 mt-4">
        Remaining card details can be any value that passes validation.
      </p>
    </div>
  );
};

export default DemoCardNumbers;
