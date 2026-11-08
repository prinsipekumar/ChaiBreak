import { api } from '../../../services/api';
import {
  fetchCategories,
  fetchMenuItems,
  MOCK_CATEGORIES,
  MOCK_ITEM_DTOS,
  toMenuItem,
} from '../../../services/menuApi';

jest.mock('../../../services/api', () => ({
  api: { get: jest.fn() },
}));

const mockedGet = api.get as jest.Mock;

describe('menuApi offline fallback', () => {
  let warnSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  it('returns bundled categories when /categories is unreachable', async () => {
    mockedGet.mockRejectedValueOnce(new Error('offline'));

    await expect(fetchCategories()).resolves.toEqual(MOCK_CATEGORIES);
    expect(warnSpy).toHaveBeenCalled();
  });

  it('returns the full mock menu when /items is unreachable', async () => {
    mockedGet.mockRejectedValueOnce(new Error('offline'));

    const items = await fetchMenuItems();

    expect(items).toHaveLength(MOCK_ITEM_DTOS.length);
    expect(items).toHaveLength(14);
    expect(warnSpy).toHaveBeenCalled();
  });

  it('applies query filters to the mock fallback', async () => {
    mockedGet.mockRejectedValueOnce(new Error('offline'));

    const drinks = await fetchMenuItems({ categoryId: 3 });
    const vegDrinks = await fetchMenuItems({ categoryId: 3, veg: true });

    expect(drinks.length).toBeGreaterThan(0);
    expect(drinks.every(item => item.category === 'Chai & Drinks')).toBe(true);
    expect(vegDrinks.every(item => item.category === 'Chai & Drinks')).toBe(
      true,
    );
    expect(vegDrinks.every(item => item.isVeg)).toBe(true);
  });
});

describe('toMenuItem', () => {
  const baseDto = {
    id: 42,
    category_id: 1,
    name: 'Test Pizza',
    description: 'A test pizza.',
    price_rupees: 199,
    is_veg: true,
    photo_url: null,
    stock_left: 6,
    is_available: true,
  };

  it('marks an item sold out when stock runs out', () => {
    expect(toMenuItem({ ...baseDto, stock_left: 0 }).isSoldOut).toBe(true);
  });

  it('marks an item sold out when it is unavailable', () => {
    expect(toMenuItem({ ...baseDto, is_available: false }).isSoldOut).toBe(true);
  });

  it('keeps a stocked, available item purchasable', () => {
    expect(toMenuItem(baseDto).isSoldOut).toBe(false);
  });

  it('maps DB columns onto the UI model', () => {
    const mapped = toMenuItem(baseDto);

    expect(mapped).toMatchObject({
      id: '42',
      name: 'Test Pizza',
      description: 'A test pizza.',
      price: 199,
      category: 'Pizza',
      isVeg: true,
      isSoldOut: false,
    });
  });

  it('uses a remote photo when the backend provides an http url', () => {
    const mapped = toMenuItem({
      ...baseDto,
      photo_url: 'https://cdn.example.com/pizza.jpg',
    });

    expect(mapped.image).toEqual({ uri: 'https://cdn.example.com/pizza.jpg' });
  });
});

describe('menuApi online path', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('maps backend rows returned inside a success envelope', async () => {
    mockedGet.mockResolvedValueOnce({
      data: {
        success: true,
        data: [
          {
            id: 42,
            category_id: 2,
            name: 'Backend Burger',
            description: 'From the API.',
            price_rupees: 149,
            is_veg: false,
            photo_url: null,
            stock_left: 3,
            is_available: true,
          },
        ],
      },
    });

    const items = await fetchMenuItems();

    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      id: '42',
      name: 'Backend Burger',
      price: 149,
      category: 'Fast Food',
      isVeg: false,
    });
  });

  it('requests the expected query params', async () => {
    mockedGet.mockResolvedValueOnce({ data: [] });

    await fetchMenuItems({ categoryId: 2, search: 'burger', veg: true });

    expect(mockedGet).toHaveBeenCalledWith('/items', {
      params: { categoryId: 2, search: 'burger', veg: true },
    });
  });
});
