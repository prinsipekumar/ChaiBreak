import {
  MENU_CATEGORIES,
  MENU_ITEMS,
  type ItemCategory,
  type MenuItem,
} from '../features/menu/data/menuData';
import { api } from './api';

/**
 * Shapes returned by the menu backend. These mirror the DB columns exactly so
 * the UI model can be built without leaking snake_case into components.
 */
export interface CategoryDto {
  id: number;
  name: string;
}

export interface ItemDto {
  id: number;
  category_id: number;
  name: string;
  description: string;
  price_rupees: number;
  is_veg: boolean;
  photo_url: string | null;
  stock_left: number;
  is_available: boolean;
}

export interface MenuItemsQuery {
  categoryId?: number;
  search?: string;
  veg?: boolean;
}

const DEFAULT_STOCK = 12;

export const MOCK_CATEGORIES: CategoryDto[] = MENU_CATEGORIES.filter(
  (category): category is ItemCategory => category !== 'All',
).map((name, index) => ({ id: index + 1, name }));

const CATEGORY_ID_BY_NAME: Record<ItemCategory, number> = MOCK_CATEGORIES.reduce(
  (map, category) => {
    map[category.name as ItemCategory] = category.id;
    return map;
  },
  {} as Record<ItemCategory, number>,
);

const CATEGORY_NAME_BY_ID: Record<number, ItemCategory> = MOCK_CATEGORIES.reduce(
  (map, category) => {
    map[category.id] = category.name as ItemCategory;
    return map;
  },
  {} as Record<number, ItemCategory>,
);

/** Existing mock catalogue expressed with the backend's column names. */
export const MOCK_ITEM_DTOS: ItemDto[] = MENU_ITEMS.map((item, index) => ({
  id: index + 1,
  category_id: CATEGORY_ID_BY_NAME[item.category],
  name: item.name,
  description: item.description,
  price_rupees: item.price,
  is_veg: item.isVeg,
  photo_url: null,
  stock_left: item.isSoldOut ? 0 : DEFAULT_STOCK,
  is_available: !item.isSoldOut,
}));

function extractList<T>(payload: unknown): T[] | null {
  if (Array.isArray(payload)) {
    return payload as T[];
  }

  const data = (payload as { data?: unknown } | null)?.data;
  if (Array.isArray(data)) {
    return data as T[];
  }

  const nested = (data as { data?: unknown } | null)?.data;
  if (Array.isArray(nested)) {
    return nested as T[];
  }

  return null;
}

function filterMockItems(query: MenuItemsQuery): ItemDto[] {
  const search = query.search?.trim().toLowerCase() ?? '';

  return MOCK_ITEM_DTOS.filter(item => {
    if (query.categoryId != null && item.category_id !== query.categoryId) {
      return false;
    }
    if (query.veg && !item.is_veg) {
      return false;
    }
    if (
      search &&
      !`${item.name} ${item.description}`.toLowerCase().includes(search)
    ) {
      return false;
    }
    return true;
  });
}

/**
 * Convert a backend item row into the presentational MenuItem. Remote photos
 * are used when present; otherwise we fall back to the bundled mock image.
 */
export function toMenuItem(dto: ItemDto): MenuItem {
  const localImage =
    MENU_ITEMS.find(item => item.name === dto.name)?.image ?? MENU_ITEMS[0].image;
  const remotePhoto = dto.photo_url?.trim();

  return {
    id: String(dto.id),
    name: dto.name,
    description: dto.description ?? '',
    price: dto.price_rupees,
    category: CATEGORY_NAME_BY_ID[dto.category_id] ?? 'Fast Food',
    isVeg: Boolean(dto.is_veg),
    isSoldOut: dto.stock_left <= 0 || !dto.is_available,
    image:
      remotePhoto && /^https?:\/\//i.test(remotePhoto)
        ? { uri: remotePhoto }
        : localImage,
  };
}

export async function fetchCategories(): Promise<CategoryDto[]> {
  try {
    const response = await api.get('/categories');
    const categories = extractList<CategoryDto>(response.data);

    if (!categories) {
      throw new Error('Unexpected /categories response shape.');
    }

    return categories;
  } catch (error) {
    console.warn(
      '[menuApi] /categories unavailable, using bundled categories.',
      error,
    );
    return MOCK_CATEGORIES;
  }
}

export async function fetchMenuItems(
  query: MenuItemsQuery = {},
): Promise<MenuItem[]> {
  try {
    const params: Record<string, string | number | boolean> = {};

    if (query.categoryId != null) {
      params.categoryId = query.categoryId;
    }
    if (query.search?.trim()) {
      params.search = query.search.trim();
    }
    if (query.veg) {
      params.veg = true;
    }

    const response = await api.get('/items', { params });
    const items = extractList<ItemDto>(response.data);

    if (!items) {
      throw new Error('Unexpected /items response shape.');
    }

    return items.map(toMenuItem);
  } catch (error) {
    console.warn('[menuApi] /items unavailable, using bundled menu.', error);
    return filterMockItems(query).map(toMenuItem);
  }
}
