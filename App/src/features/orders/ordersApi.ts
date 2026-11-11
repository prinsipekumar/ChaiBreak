import axios from 'axios';

import { api } from '../../services/api';
import { normalizeOrderStatus } from './orderStatus';
import type {
  CancelOrderResult,
  Order,
  OrderDto,
  OrderItemDto,
} from './types';

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  message?: string;
}

export class OrderApiError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = 'OrderApiError';
    this.status = status;
  }
}

const authHeaders = (token: string) => ({
  headers: { Authorization: `Bearer ${token}` },
});

const requireToken = (token: string): void => {
  if (!token) {
    throw new OrderApiError('Authentication required.', 401);
  }
};

const readEnvelope = async <T>(
  request: Promise<{ data: ApiEnvelope<T> }>,
): Promise<T> => {
  try {
    const response = await request;

    if (!response.data?.success) {
      throw new OrderApiError(
        response.data?.message || 'The server rejected the request.',
      );
    }

    return response.data.data;
  } catch (error) {
    if (error instanceof OrderApiError) {
      throw error;
    }

    if (axios.isAxiosError(error)) {
      const payload = error.response?.data as { message?: string } | undefined;
      throw new OrderApiError(
        payload?.message || error.message || 'Request failed.',
        error.response?.status,
      );
    }

    throw new OrderApiError(
      error instanceof Error ? error.message : 'Request failed.',
    );
  }
};

const toOrderItem = (dto: OrderItemDto) => ({
  id: Number(dto.id),
  itemId: Number(dto.item_id),
  name: dto.name || 'Item',
  quantity: Number(dto.quantity),
  price: Number(dto.price),
});

export const toOrder = (dto: OrderDto): Order => ({
  id: Number(dto.id),
  status: normalizeOrderStatus(dto.status),
  totalAmount: Number(dto.total_amount),
  pickupCode: dto.pickup_code,
  note: dto.note ?? null,
  createdAt: dto.created_at,
  items: (dto.items ?? []).map(toOrderItem),
  statusHistory: (dto.status_history ?? []).map(entry => ({
    status: normalizeOrderStatus(entry.status),
    createdAt: entry.created_at,
  })),
});

export async function fetchMyOrders(token: string): Promise<Order[]> {
  requireToken(token);

  const orders = await readEnvelope<OrderDto[]>(
    api.get('/orders/me', authHeaders(token)),
  );

  if (!Array.isArray(orders)) {
    throw new OrderApiError('Unexpected orders response shape.');
  }

  return orders.map(toOrder);
}

export async function fetchOrderDetails(
  token: string,
  orderId: number,
): Promise<Order> {
  requireToken(token);

  const order = await readEnvelope<OrderDto>(
    api.get(`/orders/${orderId}`, authHeaders(token)),
  );

  if (!order) {
    throw new OrderApiError('Unexpected order response shape.');
  }

  return toOrder(order);
}

export async function cancelOrderRequest(
  token: string,
  orderId: number,
): Promise<CancelOrderResult> {
  requireToken(token);

  const result = await readEnvelope<{ id: number; status: string }>(
    api.patch(`/orders/${orderId}/cancel`, undefined, authHeaders(token)),
  );

  return {
    id: Number(result.id),
    status: normalizeOrderStatus(result.status),
  };
}

export const getOrderErrorMessage = (error: unknown): string => {
  if (error instanceof OrderApiError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Something went wrong. Please try again.';
};
