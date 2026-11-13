import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import KitchenQueueScreen from './KitchenQueueScreen';
import KitchenPickupScreen from './KitchenPickupScreen';
import { useAuthStore } from '../store/authStore';

type Tab = 'queue' | 'pickup';

export default function KitchenDashboard() {
  const logout = useAuthStore(state => state.logout);
  const user = useAuthStore(state => state.user);

  const [tab, setTab] = useState<Tab>('queue');
  const [pickupId, setPickupId] = useState<number | null>(null);

  // From a Ready card: jump to Pickup with that order already chosen.
  const goToPickup = (orderId: number) => {
    setPickupId(orderId);
    setTab('pickup');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.brand}>🍳 Kitchen</Text>
          <Text style={styles.sub}>{user?.phone}</Text>
        </View>
        <TouchableOpacity onPress={logout} activeOpacity={0.8}>
          <Text style={styles.logout}>Sign out</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabBar}>
        {(
          [
            { key: 'queue', label: '📋 Orders' },
            { key: 'pickup', label: '✅ Pickup' },
          ] as { key: Tab; label: string }[]
        ).map(item => (
          <TouchableOpacity
            key={item.key}
            style={[styles.tabButton, tab === item.key && styles.tabButtonActive]}
            onPress={() => setTab(item.key)}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabText, tab === item.key && styles.tabTextActive]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.content}>
        {tab === 'queue' ? (
          <KitchenQueueScreen onPickup={goToPickup} />
        ) : (
          <KitchenPickupScreen selectedId={pickupId} onSelect={setPickupId} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F4F0' },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brand: { fontSize: 26, fontWeight: '900', color: '#6F4E37', letterSpacing: -0.5 },
  sub: { fontSize: 12, color: '#8A8A8A', fontWeight: '600', marginTop: 2 },
  logout: { fontSize: 14, fontWeight: '700', color: '#E74C3C' },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1.5,
    borderBottomColor: '#F7F4F0',
    paddingHorizontal: 12,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  tabButtonActive: { borderBottomColor: '#6F4E37' },
  tabText: { fontSize: 14, fontWeight: '600', color: '#A0A0A0' },
  tabTextActive: { color: '#6F4E37', fontWeight: '800' },
  content: { flex: 1 },
});