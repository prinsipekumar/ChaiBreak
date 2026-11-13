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

export interface KitchenItem {
  id: number;
  name: string;
  category: string;
  priceRupees: number;
  stockLeft: number;
  isAvailable: boolean;
  photoUrl: string | null;
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

export const pickupOrder = async (orderId: number, code: string) => {
  const response = await kitchenApi.post(`/orders/${orderId}/pickup`, { code });
  return response.data.data as { id: number; status: string };
};

export const getKitchenItems = async (): Promise<KitchenItem[]> => {
  const response = await kitchenApi.get('/items');
  return response.data.data as KitchenItem[];
};

export const updateItem = async (
  itemId: number,
  changes: { isAvailable?: boolean; stockLeft?: number },
) => {
  const response = await kitchenApi.patch(`/items/${itemId}`, changes);
  return response.data.data as {
    id: number;
    stockLeft: number;
    isAvailable: boolean;
  };
};

export interface PickedPhoto {
  uri: string;
  name: string;
  type: 'image/jpeg' | 'image/png';
}

// The server stores photo paths like /uploads/items/x.jpg (served from the
// server root, not from /api/v1). Turn one into a full URL for <Image>.
export const photoUrlFor = (photoUrl: string | null): string | null =>
  photoUrl ? `${API_URL.replace(/\/api\/v1$/, '')}${photoUrl}` : null;

export const uploadItemPhoto = async (itemId: number, photo: PickedPhoto) => {
  const form = new FormData();
  form.append('photo', photo as unknown as Blob);

  // fetch (not axios): React Native sets the multipart boundary itself.
  const token = useAuthStore.getState().token;
  const response = await fetch(`${API_URL}/kitchen/items/${itemId}/photo`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: form,
  });

  const json = await response.json().catch(() => null);
  if (response.status === 401) {
    useAuthStore.getState().logout();
  }
  if (!response.ok) {
    throw new Error(json?.message ?? 'Could not upload photo.');
  }
  return json.data as { id: number; photoUrl: string };
};

// Turns an axios/network error into a message that is fine to show in an Alert.
export const getErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    if (error.response) {
      return error.response.data?.message ?? 'Something went wrong.';
    }
    return 'Could not reach the server. Check your connection.';
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return 'Something went wrong.';
};
