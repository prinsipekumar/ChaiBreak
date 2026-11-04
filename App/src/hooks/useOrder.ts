import { useMutation } from '@tanstack/react-query';

export interface OrderItemInput {
  item_id: number;
  quantity: number;
  price_rupees: number;
}

export interface PlaceOrderInput {
  items: OrderItemInput[];
  payment_method: 'CASH' | 'ONLINE';
}

export interface OrderResponseData {
  order_id: number;
  pickup_code: string; // 4-digit code from server (e.g., "1234")
  total_amount: number;
  status: string;
}

// 📦 React Query Mutation for POST /api/v1/orders as required by spec page 2
export const usePlaceOrder = () => {
  return useMutation<OrderResponseData, Error, PlaceOrderInput>({
    mutationFn: async (orderData) => {
      // In production, this targets your team's Express backend:
      // const response = await fetch('http://localhost:3000/api/v1/orders', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(orderData)
      // });
      
      // Simulating server network latency response for testing:
      await new Promise((resolve) => setTimeout(resolve, 1200));
      
      // Simulating a successful response matching your spec parameters
      return {
        order_id: Math.floor(Math.random() * 90000) + 10000,
        pickup_code: String(Math.floor(Math.random() * 9000) + 1000), // Random 4-digit code
        total_amount: 105,
        status: 'PLACED'
      };
    }
  });
};