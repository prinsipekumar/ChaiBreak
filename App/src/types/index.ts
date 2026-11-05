/**
 * Database schema and domain model types
 * Matching ChaiBreak / Cafeteria Specs:
 * - categories: id, name, sort_order
 * - items: id, category_id, name, description, price_rupees, is_veg, photo_url, stock_left, is_available
 * - otp_codes: id, phone, code, expires_at, attempts, created_at
 * - orders: id, user_id, status, total_rupees, note, pickup_code, created_at, updated_at
 * - order_items: id, order_id, item_id, item_name, price_rupees, qty
 * - order_status_history: id, order_id, from_status, to_status, changed_by, changed_at
 */

export interface Category {
  id: string;
  name: string;
  sort_order: number;
  icon?: string;
  badge?: string;
}

export interface Item {
  id: string;
  category_id: string;
  name: string;
  description: string;
  price_rupees: number;
  is_veg: boolean;
  photo_url: string;
  stock_left: number;
  is_available: boolean;
  prep_time_minutes?: number;
  rating?: number;
  calories?: number;
}

export interface OtpCode {
  id: string;
  phone: string;
  code: string;
  expires_at: string;
  attempts: number;
  created_at: string;
}

export type OrderStatus = 'PLACED' | 'PREPARING' | 'READY' | 'COLLECTED' | 'CANCELLED';

export interface Order {
  id: string;
  user_id: string;
  status: OrderStatus;
  total_rupees: number;
  note: string;
  pickup_code: string;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  item_id: string;
  item_name: string;
  price_rupees: number;
  qty: number;
}

export interface OrderStatusHistory {
  id: string;
  order_id: string;
  from_status: string;
  to_status: string;
  changed_by: string; // 'kitchen' | 'employee' | 'system'
  changed_at: string;
}

export interface User {
  id: string;
  phone: string;
  name: string;
  role: 'employee' | 'kitchen';
  desk_location?: string;
}

export interface CartItem {
  item: Item;
  qty: number;
  note?: string;
}
