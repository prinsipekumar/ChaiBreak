import {
  MENU_CATEGORIES,
  MENU_ITEMS,
  type ItemCategory,
} from '../data/menuData';

describe('menu mock data', () => {
  it('covers every menu category', () => {
    const itemCategories = new Set<ItemCategory>(
      MENU_ITEMS.map(item => item.category),
    );
    const selectedCategories = MENU_CATEGORIES.filter(
      (category): category is ItemCategory => category !== 'All',
    );

    selectedCategories.forEach(category => {
      expect(itemCategories.has(category)).toBe(true);
    });
  });

  it('includes at least one sold-out item', () => {
    expect(MENU_ITEMS.some(item => item.isSoldOut)).toBe(true);
  });

  it('includes both veg and non-veg items', () => {
    expect(MENU_ITEMS.some(item => item.isVeg)).toBe(true);
    expect(MENU_ITEMS.some(item => !item.isVeg)).toBe(true);
  });

  it('uses unique ids and valid prices', () => {
    const ids = new Set(MENU_ITEMS.map(item => item.id));

    expect(ids.size).toBe(MENU_ITEMS.length);
    expect(MENU_ITEMS.every(item => item.price > 0)).toBe(true);
  });
});
