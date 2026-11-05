import { Category, Item } from '../types';
import { initialCategories, initialItems } from '../data/seedData';

const STORAGE_KEYS = {
  CATEGORIES: 'chaibreak_categories',
  ITEMS: 'chaibreak_items',
};

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key);
    if (item) return JSON.parse(item);
  } catch (e) {
    console.warn(`Error reading ${key} from storage:`, e);
  }
  return fallback;
}

function saveToStorage<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.warn(`Error writing ${key} to storage:`, e);
  }
}

let localCategories: Category[] = loadFromStorage(STORAGE_KEYS.CATEGORIES, initialCategories);
let localItems: Item[] = loadFromStorage(STORAGE_KEYS.ITEMS, initialItems);

export const apiService = {
  /**
   * GET /api/v1/categories
   * Returns categories sorted by sort_order
   */
  async getCategories(): Promise<Category[]> {
    try {
      const res = await fetch('/api/v1/categories');
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : data.categories;
        if (Array.isArray(list)) {
          localCategories = list;
          saveToStorage(STORAGE_KEYS.CATEGORIES, localCategories);
          return list;
        }
      }
    } catch {
      // Server fetch failed, use fallback
    }

    return [...localCategories].sort((a, b) => a.sort_order - b.sort_order);
  },

  /**
   * GET /api/v1/items?categoryId=&search=&veg=true
   * Server-side filtering
   * Rules: sold-out items (stock_left = 0 or is_available = false) still show,
   * but greyed out and not addable. Sort by category order, then name.
   */
  async getItems(options: {
    categoryId?: string;
    search?: string;
    veg?: boolean;
  }): Promise<Item[]> {
    const { categoryId, search, veg } = options;
    const params = new URLSearchParams();
    if (categoryId && categoryId !== 'all') params.set('categoryId', categoryId);
    if (search && search.trim()) params.set('search', search.trim());
    if (veg) params.set('veg', 'true');

    const queryString = params.toString() ? `?${params.toString()}` : '';

    try {
      const res = await fetch(`/api/v1/items${queryString}`);
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : data.items;
        if (Array.isArray(list)) {
          return list;
        }
      }
    } catch {
      // Fallback if fetch fails
    }

    // Local fallback matching exact server-side sorting and filtering
    let result = [...localItems];

    if (categoryId && categoryId !== 'all') {
      result = result.filter((i) => i.category_id === categoryId);
    }

    if (veg) {
      result = result.filter((i) => i.is_veg === true);
    }

    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (i) => i.name.toLowerCase().includes(q) || i.description.toLowerCase().includes(q)
      );
    }

    const catMap = new Map<string, number>();
    localCategories.forEach((c) => catMap.set(c.id, c.sort_order));

    result.sort((a, b) => {
      const orderA = catMap.get(a.category_id) ?? 999;
      const orderB = catMap.get(b.category_id) ?? 999;
      if (orderA !== orderB) return orderA - orderB;
      return a.name.localeCompare(b.name);
    });

    return result;
  },

  /**
   * Toggle item availability (used by pull-to-refresh test simulation)
   */
  async toggleItemSoldOut(id: string, isSoldOut: boolean): Promise<Item | null> {
    try {
      const res = await fetch(`/items/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          is_available: !isSoldOut,
          stock_left: isSoldOut ? 0 : 10,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const updated = data.item || data;
        localItems = localItems.map((i) => (i.id === id ? updated : i));
        saveToStorage(STORAGE_KEYS.ITEMS, localItems);
        return updated;
      }
    } catch {}

    const idx = localItems.findIndex((i) => i.id === id);
    if (idx !== -1) {
      localItems[idx] = {
        ...localItems[idx],
        is_available: !isSoldOut,
        stock_left: isSoldOut ? 0 : 10,
      };
      saveToStorage(STORAGE_KEYS.ITEMS, localItems);
      return localItems[idx];
    }
    return null;
  },
};
