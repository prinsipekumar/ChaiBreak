import React, { useState } from 'react';
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { requestOtp, verifyOtp } from '../services/auth.service';
import { useAuthStore } from '../store/authStore';

export default function LoginScreen() {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [loading, setLoading] = useState(false);

  const setAuth = useAuthStore(state => state.setAuth);

  const validatePhone = (value: string) => {
    return /^[6-9]\d{9}$/.test(value);
  };

  const handleRequestOtp = async () => {
    if (!validatePhone(phone)) {
      Alert.alert(
        'Invalid Phone Number',
        'Phone must be 10 digits and start with 6-9.',
      );
      return;
    }

    try {
      setLoading(true);

      const data = await requestOtp(phone);

      if (data.success) {
        setStep('otp');

        Alert.alert('OTP Sent', 'Check backend terminal for OTP.');
      } else {
        Alert.alert('Error', data.message || 'Failed to send OTP');
      }
    } catch (error) {
      console.error(error);

      Alert.alert('Network Error', 'Could not connect to backend.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 4) {
      Alert.alert('Error', 'OTP must be 4 digits.');
      return;
    }

    try {
      setLoading(true);

      const data = await verifyOtp(phone, otp);

      if (data.success) {
        setAuth(data.data.token, data.data.user);

        Alert.alert('Success', 'Logged in successfully.');
      } else {
        Alert.alert('Authentication Failed', data.message || 'Invalid OTP');
      }
    } catch (error) {
      console.error(error);

      Alert.alert('Network Error', 'Verification failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>☕ChaiBreak☕</Text>

      {step === 'phone' ? (
        <View>
          <Text style={styles.label}>Phone Number</Text>

          <TextInput
            style={styles.input}
            placeholder="xxxxxxxxxx"
            keyboardType="number-pad"
            maxLength={10}
            value={phone}
            onChangeText={setPhone}
          />

          <TouchableOpacity
            style={styles.button}
            onPress={handleRequestOtp}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Sending...' : 'Get OTP'}
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View>
          <Text style={styles.label}>Enter OTP</Text>

          <TextInput
            style={styles.input}
            placeholder="0000"
            keyboardType="number-pad"
            maxLength={4}
            value={otp}
            onChangeText={setOtp}
          />

          <TouchableOpacity
            style={styles.button}
            onPress={handleVerifyOtp}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Verifying...' : 'Login'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setStep('phone')}
          >
            <Text style={styles.backText}>Change Phone Number</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 40,
    color: '#8B5A2B',
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#8B5A2B',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  backButton: {
    marginTop: 16,
    alignItems: 'center',
  },
  backText: {
    color: '#8B5A2B',
  },
});
