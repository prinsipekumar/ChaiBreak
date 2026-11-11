import type { Order, OrderStatus } from './types';

export const ACTIVE_ORDER_STATUSES: OrderStatus[] = [
  'placed',
  'preparing',
  'ready',
];

export const HISTORY_ORDER_STATUSES: OrderStatus[] = [
  'picked_up',
  'cancelled',
];

const STATUS_ALIASES: Record<string, OrderStatus> = {
  PENDING: 'placed',
  PLACED: 'placed',
  PREPARING: 'preparing',
  READY: 'ready',
  PICKED_UP: 'picked_up',
  PICKEDUP: 'picked_up',
  COMPLETED: 'picked_up',
  CANCELLED: 'cancelled',
  CANCELED: 'cancelled',
};

const STATUS_LABELS: Record<OrderStatus, string> = {
  placed: 'Placed',
  preparing: 'Preparing',
  ready: 'Ready',
  picked_up: 'Picked up',
  cancelled: 'Cancelled',
};

const STATUS_COLORS: Record<
  OrderStatus,
  { background: string; text: string }
> = {
  placed: { background: '#FFF4E5', text: '#B26A00' },
  preparing: { background: '#EAF4FF', text: '#1565C0' },
  ready: { background: '#E8F5E9', text: '#2E7D32' },
  picked_up: { background: '#F0EDEA', text: '#6D4C41' },
  cancelled: { background: '#FDECEA', text: '#C62828' },
};

export const normalizeOrderStatus = (status: string): OrderStatus => {
  const normalized = (status ?? '').trim().toUpperCase();

  return STATUS_ALIASES[normalized] ?? (normalized.toLowerCase() as OrderStatus);
};

export const isActiveOrderStatus = (status: string): boolean =>
  ACTIVE_ORDER_STATUSES.includes(normalizeOrderStatus(status));

export const isHistoryOrderStatus = (status: string): boolean =>
  HISTORY_ORDER_STATUSES.includes(normalizeOrderStatus(status));

export const isCancellableOrderStatus = (status: string): boolean =>
  normalizeOrderStatus(status) === 'placed';

export const getOrderStatusLabel = (status: string): string =>
  STATUS_LABELS[normalizeOrderStatus(status)] ?? status;

export const getOrderStatusColors = (status: string) =>
  STATUS_COLORS[normalizeOrderStatus(status)] ?? STATUS_COLORS.placed;

export const getOrderPollingInterval = (status: string): 5000 | false =>
  isActiveOrderStatus(status) ? 5000 : false;

export const hasActiveOrders = (orders: Order[]): boolean =>
  orders.some(order => isActiveOrderStatus(order.status));

export const splitOrders = (orders: Order[]) => ({
  activeOrders: orders.filter(order => isActiveOrderStatus(order.status)),
  historyOrders: orders.filter(order => isHistoryOrderStatus(order.status)),
});

export const getOrderItemCount = (order: Order): number =>
  order.items.reduce((total, item) => total + item.quantity, 0);

export const formatPrice = (value: number): string => {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return '₹0';
  }

  return Number.isInteger(amount) ? `₹${amount}` : `₹${amount.toFixed(2)}`;
};

export const formatOrderDate = (value: string): string => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return date.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
};
