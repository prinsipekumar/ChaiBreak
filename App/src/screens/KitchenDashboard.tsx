import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import KitchenQueueScreen from './KitchenQueueScreen';
import { useAuthStore } from '../store/authStore';

export default function KitchenDashboard() {
  const logout = useAuthStore(state => state.logout);
  const user = useAuthStore(state => state.user);

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

      <View style={styles.content}>
        <KitchenQueueScreen />
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
  content: { flex: 1 },
});
