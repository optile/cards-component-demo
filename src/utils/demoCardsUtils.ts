import type { CardCategory } from "../types/demoCards";

/**
 * Copies a card number to clipboard, stripping whitespace
 * @param cardNumber - The card number with spaces
 * @returns Promise that resolves when copy is complete
 */
export const copyCardNumberToClipboard = async (
  cardNumber: string
): Promise<string> => {
  const digitsOnly = cardNumber.replace(/\s+/g, "");

  try {
    await navigator.clipboard.writeText(digitsOnly);
    return digitsOnly;
  } catch {
    // Fallback: create temporary input element
    const input = document.createElement("input");
    input.value = digitsOnly;
    document.body.appendChild(input);
    input.select();
    document.execCommand("copy");
    document.body.removeChild(input);
    return digitsOnly;
  }
};

/**
 * Filters card categories based on search term
 * @param categories - Array of card categories to filter
 * @param searchTerm - Search term to filter by (name or note)
 * @returns Filtered categories with matching cards
 */
export const filterCardCategories = (
  categories: CardCategory[],
  searchTerm: string
): CardCategory[] => {
  if (!searchTerm) return categories;

  return categories
    .map((category) => ({
      ...category,
      cards: category.cards.filter(
        (card) =>
          card.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          card.note.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    }))
    .filter((category) => category.cards.length > 0);
};
