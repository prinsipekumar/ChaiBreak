import { api } from './api';

export const requestOtp = async (phone: string) => {
  const response = await api.post('/auth/request-otp', {
    phone,
  });

  return response.data;
};

export const verifyOtp = async (phone: string, code: string) => {
  const response = await api.post('/auth/verify-otp', {
    phone,
    code,
  });

  return response.data;
};
