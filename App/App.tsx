import React, { useState } from 'react';
import {
  StatusBar,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import BottomNav, {
  type BottomTab,
} from './src/features/menu/components/BottomNav';
import LoginScreen from './src/screens/LoginScreen';
import MenuScreen from './src/screens/MenuScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import KitchenDashboard from './src/screens/KitchenDashboard';
import { useAuthStore } from './src/store/authStore';

// Initialize QueryClient with standard configuration settings
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const EmployeePortal = () => {
  const [activeTopTab, setActiveTab] = useState<'menu' | 'profile'>('menu');

  const handleBottomNav = (tab: BottomTab) => {
    if (tab === 'menu' || tab === 'profile') {
      setActiveTab(tab);
    }
  };

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
        {activeTopTab === 'profile' ? <ProfileScreen /> : <MenuScreen />}
      </View>

      <BottomNav
        activeTab={activeTopTab}
        cartCount={2}
        onSelect={handleBottomNav}
      />
    </View>
  );
};

const NavigationHub = () => {
  const token = useAuthStore(state => state.token);
  const user = useAuthStore(state => state.user);
  const isRestoringToken = useAuthStore(state => state.isRestoringToken);

  // 1. Hold navigation thread with a clean placeholder while local storage loads
  if (isRestoringToken) {
    return (
      <View style={styles.restoreContainer}>
        <ActivityIndicator size="large" color="#6D4C41" />
      </View>
    );
  }

  // 2. Storage loaded successfully - immediately forward to correct dashboard layout view
  if (!token) return <LoginScreen />;
  return user?.role === 'kitchen' ? <KitchenDashboard /> : <EmployeePortal />;
};

export default function App() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
          <StatusBar barStyle="dark-content" />
          <NavigationHub />
        </SafeAreaView>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF7F2' },
  portalContainer: { flex: 1, backgroundColor: '#FAF7F2' },
  restoreContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAF7F2',
  },
  topHeader: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 6,
  },
  brandText: {
    fontSize: 26,
    fontWeight: '900',
    color: '#6D4C41',
    letterSpacing: -0.5,
  },
  deliveryTag: {
    fontSize: 12,
    color: '#8D8D8D',
    fontWeight: '600',
    marginTop: 2,
    letterSpacing: 0.2,
  },
  topTabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1.5,
    borderBottomColor: '#F0E9E2',
    paddingHorizontal: 12,
  },
  topTabButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  activeTopTabButton: { borderBottomColor: '#8D6E63' },
  topTabText: { fontSize: 14, fontWeight: '600', color: '#8D8D8D' },
  activeTopTabText: { color: '#6D4C41', fontWeight: '800' },
  mainContent: { flex: 1 },
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
