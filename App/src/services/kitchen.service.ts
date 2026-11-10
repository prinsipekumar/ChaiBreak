import axios from 'axios';
import { API_URL } from './api';
import { useAuthStore } from '../store/authStore';

export type KitchenStatus = 'placed' | 'preparing' | 'ready';

export interface KitchenOrder {
  id: number;
  status: string;
  note: string | null;
  createdAt: string; // UTC ISO string
  minutesSinceOrdered: number;
  items: { name: string; qty: number }[];
}

// Own axios instance for /kitchen routes: adds the Bearer token to every call
// and logs the user out on a 401. (If F1 later adds this to the shared `api`
// instance, this file can use `api` directly instead.)
// A wrong pickup code is a 400 on the server, so it never triggers the logout.
const kitchenApi = axios.create({
  baseURL: `${API_URL}/kitchen`,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

kitchenApi.interceptors.request.use(config => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

kitchenApi.interceptors.response.use(
  response => response,
  error => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  },
);

export const getKitchenOrders = async (
  status: KitchenStatus,
): Promise<KitchenOrder[]> => {
  const response = await kitchenApi.get('/orders', {
    params: { status, page: 1, limit: 100 },
  });
  return response.data.data as KitchenOrder[];
};

export const advanceOrder = async (
  orderId: number,
  to: 'preparing' | 'ready',
) => {
  const response = await kitchenApi.patch(`/orders/${orderId}/status`, { to });
  return response.data.data as { id: number; status: string };
};

// Turns an axios/network error into a message that is fine to show in an Alert.
export const getErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    if (error.response) {
      return error.response.data?.message ?? 'Something went wrong.';
    }
    return 'Could not reach the server. Check your connection.';
  }
  return 'Something went wrong.';
};
