import { api } from '../../../services/api';
import {
  cancelOrderRequest,
  fetchMyOrders,
  fetchOrderDetails,
  OrderApiError,
  toOrder,
} from '../ordersApi';

jest.mock('../../../services/api', () => ({
  api: {
    get: jest.fn(),
    patch: jest.fn(),
  },
}));

const mockedGet = api.get as jest.Mock;
const mockedPatch = api.patch as jest.Mock;

const orderDto = {
  id: 101,
  user_id: 1,
  status: 'preparing',
  total_amount: '85.00',
  pickup_code: '4321',
  note: null,
  created_at: '2026-11-09T10:00:00Z',
  items: [
    {
      id: 1,
      order_id: 101,
      item_id: 7,
      name: 'Masala Chai',
      quantity: 2,
      price: '30.00',
    },
  ],
  status_history: [
    { status: 'placed', created_at: '2026-11-09T10:00:00Z' },
    { status: 'preparing', created_at: '2026-11-09T10:02:00Z' },
  ],
};

describe('ordersApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('maps an order DTO without leaking snake_case into the UI', () => {
    expect(toOrder(orderDto)).toMatchObject({
      id: 101,
      status: 'preparing',
      totalAmount: 85,
      pickupCode: '4321',
      items: [
        {
          id: 1,
          itemId: 7,
          name: 'Masala Chai',
          quantity: 2,
          price: 30,
        },
      ],
    });
  });

  it('fetches the authenticated user orders with a bearer token', async () => {
    mockedGet.mockResolvedValueOnce({
      data: { success: true, data: [orderDto] },
    });

    const orders = await fetchMyOrders('jwt-token');

    expect(mockedGet).toHaveBeenCalledWith('/orders/me', {
      headers: { Authorization: 'Bearer jwt-token' },
    });
    expect(orders).toHaveLength(1);
    expect(orders[0].status).toBe('preparing');
  });

  it('fetches one order by id', async () => {
    mockedGet.mockResolvedValueOnce({
      data: { success: true, data: orderDto },
    });

    const order = await fetchOrderDetails('jwt-token', 101);

    expect(mockedGet).toHaveBeenCalledWith('/orders/101', {
      headers: { Authorization: 'Bearer jwt-token' },
    });
    expect(order.pickupCode).toBe('4321');
    expect(order.statusHistory).toHaveLength(2);
  });

  it('cancels an order and normalizes the returned status', async () => {
    mockedPatch.mockResolvedValueOnce({
      data: {
        success: true,
        data: { id: 101, status: 'CANCELLED' },
      },
    });

    await expect(cancelOrderRequest('jwt-token', 101)).resolves.toEqual({
      id: 101,
      status: 'cancelled',
    });
    expect(mockedPatch).toHaveBeenCalledWith(
      '/orders/101/cancel',
      undefined,
      { headers: { Authorization: 'Bearer jwt-token' } },
    );
  });

  it('surfaces the backend conflict message on cancellation', async () => {
    mockedPatch.mockRejectedValueOnce({
      isAxiosError: true,
      message: 'Request failed with status code 409',
      response: {
        status: 409,
        data: { success: false, message: 'This order can no longer be cancelled.' },
      },
    });

    await expect(cancelOrderRequest('jwt-token', 101)).rejects.toMatchObject({
      name: 'OrderApiError',
      status: 409,
      message: 'This order can no longer be cancelled.',
    });
  });

  it('rejects requests when no token is available', async () => {
    await expect(fetchMyOrders('')).rejects.toBeInstanceOf(OrderApiError);
    expect(mockedGet).not.toHaveBeenCalled();
  });
});
