import { create } from 'zustand';
import { CartItem, Item } from '../types';

const CART_STORAGE_KEY = 'chaibreak_f3_cart';

function loadInitialCart(): CartItem[] {
  try {
    const saved = localStorage.getItem(CART_STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.warn('Failed to load cart from storage', e);
  }
  return [];
}

function persistCart(items: CartItem[]) {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  } catch (e) {
    console.warn('Failed to save cart to storage', e);
  }
}

export interface CartStoreState {
  items: CartItem[];
  addItem: (item: Item, qty?: number, note?: string) => boolean;
  updateQty: (itemId: string, delta: number) => void;
  removeItem: (itemId: string) => void;
  clearCart: () => void;
  getTotalCount: () => number;
  getTotalRupees: () => number;
}

export const useCartStore = create<CartStoreState>((set, get) => ({
  items: loadInitialCart(),

  addItem: (item: Item, qty = 1, note = '') => {
    const isSoldOut = item.stock_left <= 0 || !item.is_available;
    if (isSoldOut) {
      console.warn(`Cannot add sold-out item "${item.name}" to cart.`);
      return false;
    }

    const currentItems = get().items;
    const existingIndex = currentItems.findIndex((ci) => ci.item.id === item.id);
    let updatedItems: CartItem[];

    if (existingIndex > -1) {
      updatedItems = [...currentItems];
      const current = updatedItems[existingIndex];
      const maxAvailable = item.stock_left;
      const newQty = Math.min(current.qty + qty, maxAvailable);
      updatedItems[existingIndex] = {
        ...current,
        qty: newQty,
        note: note || current.note,
      };
    } else {
      const finalQty = Math.min(qty, item.stock_left);
      updatedItems = [
        ...currentItems,
        {
          item,
          qty: finalQty > 0 ? finalQty : 1,
          note,
        },
      ];
    }

    persistCart(updatedItems);
    set({ items: updatedItems });
    return true;
  },

  updateQty: (itemId: string, delta: number) => {
    const currentItems = get().items;
    const existingIndex = currentItems.findIndex((ci) => ci.item.id === itemId);
    if (existingIndex === -1) return;

    let updatedItems = [...currentItems];
    const current = updatedItems[existingIndex];
    const newQty = current.qty + delta;

    if (newQty <= 0) {
      updatedItems = updatedItems.filter((ci) => ci.item.id !== itemId);
    } else {
      const maxAvailable = current.item.stock_left;
      updatedItems[existingIndex] = {
        ...current,
        qty: Math.min(newQty, maxAvailable > 0 ? maxAvailable : newQty),
      };
    }

    persistCart(updatedItems);
    set({ items: updatedItems });
  },

  removeItem: (itemId: string) => {
    const updatedItems = get().items.filter((ci) => ci.item.id !== itemId);
    persistCart(updatedItems);
    set({ items: updatedItems });
  },

  clearCart: () => {
    persistCart([]);
    set({ items: [] });
  },

  getTotalCount: () => {
    return get().items.reduce((sum, item) => sum + item.qty, 0);
  },

  getTotalRupees: () => {
    return get().items.reduce((sum, item) => sum + item.item.price_rupees * item.qty, 0);
  },
}));

// Compatibility hook matching previous useCart interface
export function useCart() {
  const store = useCartStore();
  return {
    items: store.items,
    totalCount: store.getTotalCount(),
    totalRupees: store.getTotalRupees(),
    addItem: store.addItem,
    updateQty: store.updateQty,
    removeItem: store.removeItem,
    clearCart: store.clearCart,
  };
}
