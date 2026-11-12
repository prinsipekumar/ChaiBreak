import type { MenuCategory, MenuItem } from './data/menuData';

export interface MenuFilters {
  searchQuery: string;
  category: MenuCategory;
  vegOnly: boolean;
}

/**
 * Applies the search, category and veg filters together, then returns a fresh
 * alphabetically sorted list. Sorting after filtering keeps it stable across
 * every filter combination.
 */
export function filterMenuItems(
  items: MenuItem[],
  { searchQuery, category, vegOnly }: MenuFilters,
): MenuItem[] {
  const query = searchQuery.trim().toLowerCase();

  return items
    .filter(item => category === 'All' || item.category === category)
    .filter(item => !vegOnly || item.isVeg)
    .filter(item => {
      if (!query) {
        return true;
      }

      return (
        item.name.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query)
      );
    })
    .sort((first, second) => first.name.localeCompare(second.name));
}
