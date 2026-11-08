import React, { useState } from 'react';
import {
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { API_URL } from '../services/api';
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
        'Phone must be 10 digits and start with a number from 6 to 9.',
      );
      return;
    }

    try {
      setLoading(true);
      const data = await requestOtp(phone);

      if (data?.success) {
        setStep('otp');
        Alert.alert('OTP Sent', 'Check backend terminal for OTP.');
      } else {
        Alert.alert('Error', data?.message || 'Failed to send OTP.');
      }
    } catch (error) {
      console.error(error);
      Alert.alert(
        'Network Error',
        `Could not reach the backend at ${API_URL}. Make sure the server is running.`,
      );
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 4) {
      Alert.alert('Error', 'OTP must be exactly 4 digits.');
      return;
    }

    try {
      setLoading(true);
      const data = await verifyOtp(phone, otp);

      const targetToken = data?.data?.token || data?.token;
      const targetUser = data?.data?.user || data?.user;

      if (targetToken && targetUser) {
        setAuth(targetToken, targetUser);
        Alert.alert('Success', 'Logged in successfully.');
      } else {
        Alert.alert(
          'Authentication Failed',
          data?.message ||
            'Invalid token response structure received from backend.',
        );
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Network Error', 'Verification failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardContainer}
      >
        <View style={styles.cardContainer}>
          <Text style={styles.title}>☕ ChaiBreak</Text>
          <Text style={styles.subtitle}>Office Canteen Pre-Ordering App</Text>

          {step === 'phone' ? (
            <View>
              <Text style={styles.label}>Phone Number</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter 10-digit number"
                placeholderTextColor="#A0A0A0"
                keyboardType="number-pad"
                maxLength={10}
                value={phone}
                onChangeText={setPhone}
                editable={!loading}
              />
              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleRequestOtp}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <Text style={styles.buttonText}>Get OTP</Text>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <View>
              <Text style={styles.label}>Verification Code</Text>
              <TextInput
                style={[styles.input, styles.otpInput]}
                placeholder="0 0 0 0"
                placeholderTextColor="#A0A0A0"
                keyboardType="number-pad"
                maxLength={4}
                value={otp}
                onChangeText={setOtp}
                editable={!loading}
              />
              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleVerifyOtp}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <Text style={styles.buttonText}>Verify & Login</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => {
                  setOtp('');
                  setStep('phone');
                }}
                disabled={loading}
              >
                <Text style={styles.backText}>Change Phone Number</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#F7F4F0',
  },
  keyboardContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  cardContainer: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#8B5A2B',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    textAlign: 'center',
    color: '#6F4E37',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    color: '#8A8A8A',
    marginBottom: 32,
    fontWeight: '500',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#4A4A4A',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#EAEAEA',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 20,
    color: '#2B2B2B',
    backgroundColor: '#FAFAFA',
    fontWeight: '500',
  },
  otpInput: {
    textAlign: 'center',
    fontSize: 22,
    letterSpacing: 8,
    fontWeight: '700',
  },
  button: {
    backgroundColor: '#6F4E37',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    shadowColor: '#6F4E37',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 2,
  },
  buttonDisabled: {
    backgroundColor: '#A39081',
  },
  buttonText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 0.5,
  },
  backButton: {
    marginTop: 20,
    alignItems: 'center',
    paddingVertical: 4,
  },
  backText: {
    color: '#6F4E37',
    fontSize: 14,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});
