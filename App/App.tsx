import React, { useState } from 'react';
import {
  StatusBar,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import LoginScreen from './src/screens/LoginScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import { useAuthStore } from './src/store/authStore';

// Initialize QueryClient with standard configuration settings
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const KitchenDashboard = () => {
  const logout = useAuthStore(state => state.logout);
  const user = useAuthStore(state => state.user);

  return (
    <View style={styles.kitchenContainer}>
      <Text style={styles.kitchenIcon}>🍳</Text>
      <Text style={styles.kitchenTitle}>Kitchen Orders Dashboard</Text>
      <Text style={styles.kitchenSub}>
        Staff Operator Panel ({user?.phone})
      </Text>
      <TouchableOpacity
        style={styles.kitchenLogoutBtn}
        onPress={logout}
        activeOpacity={0.8}
      >
        <Text style={styles.kitchenLogoutText}>Sign Out Account</Text>
      </TouchableOpacity>
    </View>
  );
};

// Placeholder for F2 Menu items
const MenuPlaceholder = () => (
  <View style={styles.menuPlaceholder}>
    <Text style={styles.placeholderIcon}>☕</Text>
    <Text style={styles.placeholderTitle}>Canteen Snacks Menu</Text>
  </View>
);

const EmployeePortal = () => {
  const [activeTopTab, setActiveTab] = useState<'menu' | 'profile'>('profile');

  return (
    <View style={styles.portalContainer}>
      {/* Header Banner */}
      <View style={styles.topHeader}>
        <Text style={styles.brandText}>☕ ChaiBreak</Text>
        <Text style={styles.deliveryTag}>It's Good to Have a Break</Text>
      </View>

      {/* Top Navigation Segment Controller */}
      <View style={styles.topTabBar}>
        <TouchableOpacity
          style={[
            styles.topTabButton,
            activeTopTab === 'menu' && styles.activeTopTabButton,
          ]}
          onPress={() => setActiveTab('menu')}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.topTabText,
              activeTopTab === 'menu' && styles.activeTopTabText,
            ]}
          >
            📋 Canteen Menu
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.topTabButton,
            activeTopTab === 'profile' && styles.activeTopTabButton,
          ]}
          onPress={() => setActiveTab('profile')}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.topTabText,
              activeTopTab === 'profile' && styles.activeTopTabText,
            ]}
          >
            👤 My Profile
          </Text>
        </TouchableOpacity>
      </View>

      {/* Dynamic View Injection Layer */}
      <View style={styles.mainContent}>
        {activeTopTab === 'profile' ? <ProfileScreen /> : <MenuPlaceholder />}
      </View>
    </View>
  );
};

const NavigationHub = () => {
  const token = useAuthStore(state => state.token);
  const user = useAuthStore(state => state.user);

  if (!token) return <LoginScreen />;
  return user?.role === 'kitchen' ? <KitchenDashboard /> : <EmployeePortal />;
};

export default function App() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
          <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
          <NavigationHub />
        </SafeAreaView>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  portalContainer: { flex: 1, backgroundColor: '#F7F4F0' },
  topHeader: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 6,
  },
  brandText: {
    fontSize: 26,
    fontWeight: '900',
    color: '#6F4E37',
    letterSpacing: -0.5,
  },
  deliveryTag: {
    fontSize: 12,
    color: '#8A8A8A',
    fontWeight: '600',
    marginTop: 2,
    letterSpacing: 0.2,
  },
  topTabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1.5,
    borderBottomColor: '#F7F4F0',
    paddingHorizontal: 12,
  },
  topTabButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  activeTopTabButton: { borderBottomColor: '#6F4E37' },
  topTabText: { fontSize: 14, fontWeight: '600', color: '#A0A0A0' },
  activeTopTabText: { color: '#6F4E37', fontWeight: '800' },
  mainContent: { flex: 1 },
  menuPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    margin: 20,
    borderRadius: 20,
    padding: 24,
    shadowColor: '#6F4E37',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  placeholderIcon: { fontSize: 64, marginBottom: 12 },
  placeholderTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2B2B2B',
    marginBottom: 6,
  },
  placeholderSub: {
    fontSize: 13,
    color: '#8A8A8A',
    textAlign: 'center',
    lineHeight: 18,
  },
  kitchenContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#F7F4F0',
  },
  kitchenIcon: { fontSize: 72, marginBottom: 16 },
  kitchenTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#2B2B2B',
    marginBottom: 6,
  },
  kitchenSub: {
    fontSize: 14,
    color: '#8A8A8A',
    marginBottom: 40,
    fontWeight: '500',
  },
  kitchenLogoutBtn: {
    backgroundColor: '#E74C3C',
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 12,
    width: '80%',
    alignItems: 'center',
    shadowColor: '#E74C3C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 2,
  },
  kitchenLogoutText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
