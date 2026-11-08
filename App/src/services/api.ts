import { Platform } from 'react-native';
import axios from 'axios';

// Android emulators cannot reach the host machine via "localhost": that points
// back at the emulator itself. 10.0.2.2 is the emulator's alias for the host.
// When running on a physical phone, replace this with your computer's LAN IP,
// e.g. http://192.168.1.20:5000/api/v1 (phone and PC must share the same Wi-Fi).
const API_HOST = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';

export const API_URL = `http://${API_HOST}:5000/api/v1`;

export const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});
