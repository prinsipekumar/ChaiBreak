import { filterMenuItems } from '../filterMenuItems';
import type { MenuItem } from '../data/menuData';

const image = { uri: 'test-image' };

const items: MenuItem[] = [
  {
    id: 'chicken-roll',
    name: 'Chicken Roll',
    description: 'Smoky kebab wrapped in roti.',
    price: 179,
    category: 'Fast Food',
    isVeg: false,
    image,
  },
  {
    id: 'margherita',
    name: 'Margherita Pizza',
    description: 'Tomato and basil.',
    price: 249,
    category: 'Pizza',
    isVeg: true,
    image,
  },
  {
    id: 'masala-chai',
    name: 'Masala Chai',
    description: 'Ginger tea.',
    price: 40,
    category: 'Chai & Drinks',
    isVeg: true,
    image,
  },
  {
    id: 'paneer-pizza',
    name: 'Paneer Pizza',
    description: 'Cottage cheese and peppers.',
    price: 329,
    category: 'Pizza',
    isVeg: true,
    image,
  },
  {
    id: 'peri-fries',
    name: 'Peri Fries',
    description: 'Spicy fries.',
    price: 119,
    category: 'Fast Food',
    isVeg: true,
    image,
  },
  {
    id: 'tandoori-pizza',
    name: 'Tandoori Pizza',
    description: 'Smoky chicken.',
    price: 379,
    category: 'Pizza',
    isVeg: false,
    image,
  },
];

const namesOf = (result: MenuItem[]) => result.map(item => item.name);

describe('filterMenuItems', () => {
  it('sorts items alphabetically by name', () => {
    expect(
      namesOf(
        filterMenuItems(items, {
          searchQuery: '',
          category: 'All',
          vegOnly: false,
        }),
      ),
    ).toEqual([
      'Chicken Roll',
      'Margherita Pizza',
      'Masala Chai',
      'Paneer Pizza',
      'Peri Fries',
      'Tandoori Pizza',
    ]);
  });

  it('filters by category', () => {
    expect(
      namesOf(
        filterMenuItems(items, {
          searchQuery: '',
          category: 'Pizza',
          vegOnly: false,
        }),
      ),
    ).toEqual(['Margherita Pizza', 'Paneer Pizza', 'Tandoori Pizza']);
  });

  it('keeps only vegetarian items when the veg toggle is on', () => {
    const result = filterMenuItems(items, {
      searchQuery: '',
      category: 'All',
      vegOnly: true,
    });

    expect(result.every(item => item.isVeg)).toBe(true);
    expect(namesOf(result)).not.toContain('Chicken Roll');
  });

  it('searches names and descriptions case-insensitively', () => {
    expect(
      namesOf(
        filterMenuItems(items, {
          searchQuery: 'PANEER',
          category: 'All',
          vegOnly: false,
        }),
      ),
    ).toEqual(['Paneer Pizza']);

    expect(
      namesOf(
        filterMenuItems(items, {
          searchQuery: 'smoky',
          category: 'All',
          vegOnly: false,
        }),
      ),
    ).toEqual(['Chicken Roll', 'Tandoori Pizza']);
  });

  it('combines search, category and veg filters', () => {
    expect(
      namesOf(
        filterMenuItems(items, {
          searchQuery: 'paneer',
          category: 'Pizza',
          vegOnly: true,
        }),
      ),
    ).toEqual(['Paneer Pizza']);

    expect(
      filterMenuItems(items, {
        searchQuery: 'smoky',
        category: 'Pizza',
        vegOnly: true,
      }),
    ).toEqual([]);
  });
});
