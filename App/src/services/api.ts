import { Platform } from 'react-native';
import DeviceInfo from 'react-native-device-info';
import axios from 'axios';

// Check if it's a simulator or a real phone
const isEmulator = DeviceInfo.isEmulatorSync();

export const API_HOST =
  isEmulator && Platform.OS === 'android' ? '10.0.2.2' : 'localhost';

export const API_URL = `http://${API_HOST}:5000/api/v1`;

export const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});
