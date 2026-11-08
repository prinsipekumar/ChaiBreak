import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { API_URL } from '../services/api';
import { useAuthStore } from '../store/authStore';

const PROFILE_CACHE_KEY = 'profile-cache';

interface UserProfile {
  id: number;
  phone: string;
  name: string | null;
  role: 'employee' | 'kitchen';
}

async function readCachedProfile(): Promise<UserProfile | null> {
  try {
    const raw = await AsyncStorage.getItem(PROFILE_CACHE_KEY);
    return raw ? (JSON.parse(raw) as UserProfile) : null;
  } catch {
    return null;
  }
}

async function writeCachedProfile(profile: UserProfile): Promise<void> {
  try {
    await AsyncStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(profile));
  } catch {
    // A cache write failure should never block the live profile.
  }
}

export default function ProfileScreen() {
  const token = useAuthStore(state => state.token);
  const logout = useAuthStore(state => state.logout);
  const queryClient = useQueryClient();
  const [nameInput, setNameInput] = useState('');

  const fetchHeaders = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  // 1. GET /me — falls back to the cached profile when the backend is offline.
  const {
    data: profile,
    isLoading,
    isError,
    isFetching,
    refetch,
  } = useQuery<UserProfile>({
    queryKey: ['profile', token],
    enabled: !!token,
    queryFn: async () => {
      try {
        const res = await fetch(`${API_URL}/me`, { headers: fetchHeaders });

        if (res.status === 401) {
          logout();
          throw new Error('Session expired');
        }

        if (!res.ok) {
          throw new Error(`Profile request failed (${res.status}).`);
        }

        const result = await res.json();

        if (!result.success || !result.data) {
          throw new Error(result.message || 'Failed to load profile.');
        }

        const nextProfile = result.data as UserProfile;
        await writeCachedProfile(nextProfile);
        return nextProfile;
      } catch (error) {
        if (error instanceof Error && error.message === 'Session expired') {
          throw error;
        }

        const cachedProfile = await readCachedProfile();
        if (cachedProfile) {
          return cachedProfile;
        }

        // The auth store is persisted too, so it is a valid last-resort cache.
        const authUser = useAuthStore.getState().user;
        if (authUser) {
          return {
            id: authUser.id,
            phone: authUser.phone,
            name: authUser.name || null,
            role: authUser.role === 'kitchen' ? 'kitchen' : 'employee',
          };
        }

        throw error;
      }
    },
  });

  useEffect(() => {
    if (profile?.name) {
      setNameInput(profile.name);
    }
  }, [profile]);

  // 2. PATCH /me
  const updateMutation = useMutation({
    mutationFn: async (newName: string) => {
      const res = await fetch(`${API_URL}/me`, {
        method: 'PATCH',
        headers: fetchHeaders,
        body: JSON.stringify({ name: newName }),
      });
      return res.json();
    },
    onSuccess: result => {
      if (result.success) {
        if (result.data) {
          writeCachedProfile(result.data as UserProfile);
        }
        Alert.alert('Profile Saved', 'Display name updated successfully.');
        queryClient.invalidateQueries({ queryKey: ['profile'] });
      } else {
        Alert.alert('Update Failed', result.message || 'Something went wrong.');
      }
    },
    onError: () => {
      Alert.alert('Network Error', 'Failed to save changes.');
    },
  });

  const handleUpdate = () => {
    if (!nameInput.trim()) {
      Alert.alert('Validation Error', 'Name cannot be empty.');
      return;
    }
    updateMutation.mutate(nameInput.trim());
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#6F4E37" />
      </View>
    );
  }

  if (isError || !profile) {
    return (
      <View style={styles.centered}>
        <View style={styles.errorIconWrap}>
          <Text style={styles.errorIcon}>☕</Text>
        </View>
        <Text style={styles.errorTitle}>Profile unavailable</Text>
        <Text style={styles.errorMessage}>
          We couldn't load your profile right now. Check your connection and try
          again.
        </Text>

        <TouchableOpacity
          style={[styles.btnRetry, isFetching && styles.btnDisabled]}
          onPress={() => refetch()}
          disabled={isFetching}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Retry loading profile"
        >
          {isFetching ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.btnRetryText}>Retry</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.btnLogout}
          onPress={logout}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Logout"
        >
          <Text style={styles.btnLogoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeContainer}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flexContainer}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Account Profile</Text>

            <View style={styles.infoRow}>
              <Text style={styles.fieldLabel}>Phone Number</Text>
              <Text style={styles.fieldValue}>{profile.phone}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.fieldLabel}>Canteen Role</Text>
              <Text
                style={[
                  styles.roleValue,
                  profile.role === 'kitchen'
                    ? styles.roleKitchen
                    : styles.roleEmployee,
                ]}
              >
                {profile.role?.toUpperCase()}
              </Text>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.fieldLabel}>Display Name</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Set your account name"
                placeholderTextColor="#A0A0A0"
                value={nameInput}
                onChangeText={setNameInput}
                editable={!updateMutation.isPending}
              />
            </View>

            <TouchableOpacity
              style={[
                styles.actionButton,
                styles.saveBtn,
                updateMutation.isPending && styles.btnDisabled,
              ]}
              onPress={handleUpdate}
              disabled={updateMutation.isPending}
              activeOpacity={0.8}
            >
              {updateMutation.isPending ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <Text style={styles.actionButtonText}>Update Profile</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.logoutBtn]}
              onPress={logout}
              activeOpacity={0.7}
            >
              <Text style={styles.logoutBtnText}>Log Out Account</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: { flex: 1, backgroundColor: '#F7F4F0' },
  flexContainer: { flex: 1 },
  scrollContainer: { padding: 20, justifyContent: 'center', flexGrow: 1 },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F7F4F0',
    padding: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#6F4E37',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#6F4E37',
    marginBottom: 24,
    letterSpacing: 0.3,
  },
  infoRow: {
    marginBottom: 20,
    borderBottomWidth: 1.5,
    borderBottomColor: '#F7F4F0',
    paddingBottom: 12,
  },
  fieldLabel: {
    fontSize: 12,
    color: '#8A8A8A',
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 6,
    letterSpacing: 0.8,
  },
  fieldValue: { fontSize: 16, color: '#2B2B2B', fontWeight: '600' },
  roleValue: { fontSize: 14, fontWeight: '700' },
  roleKitchen: { color: '#D97706' }, // Amber warning color for production workspace access
  roleEmployee: { color: '#6F4E37' }, // Standard coffee tone theme
  inputContainer: { marginTop: 4, marginBottom: 28 },
  textInput: {
    borderWidth: 1.5,
    borderColor: '#EAEAEA',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: '#2B2B2B',
    backgroundColor: '#FAFAFA',
    marginTop: 6,
    fontWeight: '500',
  },
  actionButton: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: 56,
  },
  saveBtn: {
    backgroundColor: '#6F4E37',
    marginBottom: 12,
    shadowColor: '#6F4E37',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 2,
  },
  btnDisabled: { backgroundColor: '#A39081' },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  logoutBtn: { borderWidth: 1.5, borderColor: '#E74C3C', marginTop: 8 },
  logoutBtnText: {
    color: '#E74C3C',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  errorIconWrap: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3EBE4',
    marginBottom: 18,
  },
  errorIcon: { fontSize: 34 },
  errorTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#3E2723',
    marginBottom: 8,
    letterSpacing: -0.2,
  },
  errorMessage: {
    maxWidth: 280,
    textAlign: 'center',
    fontSize: 13.5,
    lineHeight: 21,
    fontWeight: '500',
    color: '#8A8A8A',
    marginBottom: 26,
  },
  btnRetry: {
    height: 50,
    width: 200,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8D6E63',
    borderRadius: 12,
  },
  btnRetryText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
  btnLogout: {
    marginTop: 12,
    height: 50,
    width: 200,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E74C3C',
  },
  btnLogoutText: {
    color: '#E74C3C',
    fontSize: 15,
    fontWeight: '700',
  },
});
