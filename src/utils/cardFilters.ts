import type { CardCategory } from "../types/demoCards";

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
