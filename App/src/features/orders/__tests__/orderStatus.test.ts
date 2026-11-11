import {
  formatPrice,
  getOrderPollingInterval,
  hasActiveOrders,
  isCancellableOrderStatus,
  normalizeOrderStatus,
  splitOrders,
} from '../orderStatus';
import type { Order } from '../types';

const makeOrder = (
  id: number,
  status: Order['status'],
): Order => ({
  id,
  status,
  totalAmount: 100,
  pickupCode: '1234',
  note: null,
  createdAt: '2026-11-09T10:00:00Z',
  items: [
    { id: id * 10, itemId: 1, name: 'Masala Chai', quantity: 2, price: 30 },
  ],
  statusHistory: [],
});

describe('orderStatus helpers', () => {
  it('normalizes current and legacy status values', () => {
    expect(normalizeOrderStatus('PENDING')).toBe('placed');
    expect(normalizeOrderStatus('PREPARING')).toBe('preparing');
    expect(normalizeOrderStatus('picked_up')).toBe('picked_up');
    expect(normalizeOrderStatus('CANCELED')).toBe('cancelled');
  });

  it('splits active orders from order history', () => {
    const result = splitOrders([
      makeOrder(1, 'placed'),
      makeOrder(2, 'preparing'),
      makeOrder(3, 'ready'),
      makeOrder(4, 'picked_up'),
      makeOrder(5, 'cancelled'),
    ]);

    expect(result.activeOrders.map(order => order.id)).toEqual([1, 2, 3]);
    expect(result.historyOrders.map(order => order.id)).toEqual([4, 5]);
  });

  it('polls only while an order is active', () => {
    expect(getOrderPollingInterval('placed')).toBe(5000);
    expect(getOrderPollingInterval('preparing')).toBe(5000);
    expect(getOrderPollingInterval('ready')).toBe(5000);
    expect(getOrderPollingInterval('picked_up')).toBe(false);
    expect(getOrderPollingInterval('cancelled')).toBe(false);
  });

  it('detects active lists and cancellable orders', () => {
    expect(hasActiveOrders([makeOrder(1, 'picked_up')])).toBe(false);
    expect(hasActiveOrders([makeOrder(1, 'picked_up'), makeOrder(2, 'ready')])).toBe(
      true,
    );
    expect(isCancellableOrderStatus('placed')).toBe(true);
    expect(isCancellableOrderStatus('PENDING')).toBe(true);
    expect(isCancellableOrderStatus('preparing')).toBe(false);
  });

  it('formats prices consistently', () => {
    expect(formatPrice(85)).toBe('₹85');
    expect(formatPrice(85.5)).toBe('₹85.50');
  });
});
