export type OrderStatus =
  | 'placed'
  | 'preparing'
  | 'ready'
  | 'picked_up'
  | 'cancelled';

export interface OrderItem {
  id: number;
  itemId: number;
  name: string;
  quantity: number;
  price: number;
}

export interface OrderStatusHistoryEntry {
  status: OrderStatus;
  createdAt: string;
}

export interface Order {
  id: number;
  status: OrderStatus;
  totalAmount: number;
  pickupCode: string;
  note: string | null;
  createdAt: string;
  items: OrderItem[];
  statusHistory: OrderStatusHistoryEntry[];
}

export interface OrderItemDto {
  id: number;
  order_id: number;
  item_id: number;
  name: string;
  quantity: number;
  price: number | string;
}

export interface OrderStatusHistoryDto {
  status: string;
  created_at: string;
}

export interface OrderDto {
  id: number;
  user_id: number;
  status: string;
  total_amount: number | string;
  pickup_code: string;
  note: string | null;
  created_at: string;
  items?: OrderItemDto[];
  status_history?: OrderStatusHistoryDto[];
}

export interface CancelOrderResult {
  id: number;
  status: OrderStatus;
}
