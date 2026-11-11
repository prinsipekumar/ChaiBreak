import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import { useAuthStore } from '../../../store/authStore';
import {
  cancelOrderRequest,
  fetchMyOrders,
  fetchOrderDetails,
} from '../ordersApi';
import { getOrderPollingInterval, hasActiveOrders } from '../orderStatus';
import type { Order } from '../types';

export const orderKeys = {
  all: ['orders'] as const,
  list: ['orders', 'me'] as const,
  detail: (orderId: number) => ['orders', 'detail', orderId] as const,
};

export function useMyOrders() {
  const token = useAuthStore(state => state.token);

  return useQuery({
    queryKey: orderKeys.list,
    enabled: Boolean(token),
    queryFn: () => fetchMyOrders(token as string),
    refetchInterval: query =>
      hasActiveOrders(query.state.data ?? []) ? 5000 : false,
  });
}

export function useOrderDetails(orderId: number) {
  const token = useAuthStore(state => state.token);

  return useQuery({
    queryKey: orderKeys.detail(orderId),
    enabled: Boolean(token) && orderId > 0,
    queryFn: () => fetchOrderDetails(token as string, orderId),
    refetchInterval: query =>
      query.state.data
        ? getOrderPollingInterval(query.state.data.status)
        : false,
  });
}

export function useCancelOrder(orderId: number) {
  const token = useAuthStore(state => state.token);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => cancelOrderRequest(token as string, orderId),
    onSuccess: result => {
      if (result.status === 'cancelled') {
        queryClient.setQueryData<Order>(
          orderKeys.detail(orderId),
          current =>
            current ? { ...current, status: result.status } : current,
        );
        queryClient.setQueryData<Order[]>(orderKeys.list, current =>
          current?.map(order =>
            order.id === orderId
              ? { ...order, status: result.status }
              : order,
          ),
        );
      }

      queryClient.invalidateQueries({ queryKey: orderKeys.detail(orderId) });
      queryClient.invalidateQueries({ queryKey: orderKeys.list });
    },
  });
}
