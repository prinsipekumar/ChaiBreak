import type { ImageSourcePropType } from 'react-native';

export const MENU_CATEGORIES = ['All', 'Pizza', 'Fast Food', 'Chai & Drinks'] as const;

export type MenuCategory = (typeof MENU_CATEGORIES)[number];
export type ItemCategory = Exclude<MenuCategory, 'All'>;

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: ItemCategory;
  isVeg: boolean;
  isSoldOut?: boolean;
  image: ImageSourcePropType;
}

/**
 * Mock canteen catalogue. Every category deliberately has a few entries so the
 * search / category / veg filters can be combined meaningfully.
 */
export const MENU_ITEMS: MenuItem[] = [
  {
    id: 'pizza-margherita',
    name: 'Classic Margherita Pizza',
    description: 'San Marzano tomato, fresh mozzarella and basil.',
    price: 249,
    category: 'Pizza',
    isVeg: true,
    image: require('../../../assets/menu/margherita-pizza.jpg'),
  },
  {
    id: 'drinks-cold-coffee',
    name: 'Cold Coffee',
    description: 'Creamy iced coffee finished with a chocolate drizzle.',
    price: 129,
    category: 'Chai & Drinks',
    isVeg: true,
    image: require('../../../assets/menu/cold-coffee.jpg'),
  },
  {
    id: 'fast-chicken-burger',
    name: 'Classic Chicken Burger',
    description: 'Juicy grilled chicken patty, cheddar and house sauce.',
    price: 149,
    category: 'Fast Food',
    isVeg: false,
    image: require('../../../assets/menu/burger.jpg'),
  },
  {
    id: 'drinks-brownie-shake',
    name: 'Chocolate Brownie Shake',
    description: 'Thick cocoa shake blended with a fudgy brownie.',
    price: 169,
    category: 'Chai & Drinks',
    isVeg: true,
    image: require('../../../assets/menu/brownie-shake.jpg'),
  },
  {
    id: 'fast-chicken-roll',
    name: 'Chicken Seekh Roll',
    description: 'Smoky seekh kebab wrapped in a soft roomali roti.',
    price: 179,
    category: 'Fast Food',
    isVeg: false,
    isSoldOut: true,
    image: require('../../../assets/menu/chicken-roll.jpg'),
  },
  {
    id: 'pizza-farmhouse',
    name: 'Farmhouse Veggie Pizza',
    description: 'Sweet corn, capsicum, onion and cherry tomatoes.',
    price: 299,
    category: 'Pizza',
    isVeg: true,
    image: require('../../../assets/menu/veggie-pizza.jpg'),
  },
  {
    id: 'drinks-filter-coffee',
    name: 'Filter Coffee',
    description: 'Slow-brewed South Indian filter coffee with milk.',
    price: 55,
    category: 'Chai & Drinks',
    isVeg: true,
    image: require('../../../assets/menu/filter-coffee.jpg'),
  },
  {
    id: 'drinks-iced-tea',
    name: 'Iced Lemon Tea',
    description: 'Chilled black tea shaken with lemon and mint.',
    price: 89,
    category: 'Chai & Drinks',
    isVeg: true,
    image: require('../../../assets/menu/iced-tea.jpg'),
  },
  {
    id: 'drinks-masala-chai',
    name: 'Masala Chai',
    description: 'Slow-brewed Assam tea with ginger and cardamom.',
    price: 40,
    category: 'Chai & Drinks',
    isVeg: true,
    image: require('../../../assets/menu/masala-chai.jpg'),
  },
  {
    id: 'pizza-paneer-tikka',
    name: 'Paneer Tikka Pizza',
    description: 'Tandoori paneer, onion and a swirl of mint mayo.',
    price: 329,
    category: 'Pizza',
    isVeg: true,
    image: require('../../../assets/menu/paneer-pizza.jpg'),
  },
  {
    id: 'fast-paneer-sandwich',
    name: 'Peppy Paneer Sandwich',
    description: 'Grilled paneer, peppers and tangy green chutney.',
    price: 139,
    category: 'Fast Food',
    isVeg: true,
    image: require('../../../assets/menu/sandwich.jpg'),
  },
  {
    id: 'fast-peri-fries',
    name: 'Peri Peri Fries',
    description: 'Crisp fries tossed in fiery peri peri seasoning.',
    price: 119,
    category: 'Fast Food',
    isVeg: true,
    image: require('../../../assets/menu/fries.jpg'),
  },
  {
    id: 'pizza-tandoori-chicken',
    name: 'Tandoori Chicken Pizza',
    description: 'Tandoori chicken, red onion and smoky mozzarella.',
    price: 379,
    category: 'Pizza',
    isVeg: false,
    image: require('../../../assets/menu/tandoori-pizza.jpg'),
  },
  {
    id: 'fast-veg-samosa',
    name: 'Vegetable Samosa',
    description: 'Golden pastry parcels filled with spiced potato.',
    price: 35,
    category: 'Fast Food',
    isVeg: true,
    image: require('../../../assets/menu/samosa.jpg'),
  },
];
