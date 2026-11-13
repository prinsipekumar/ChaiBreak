import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  advanceOrder,
  getErrorMessage,
  getKitchenOrders,
  KitchenOrder,
  KitchenStatus,
} from '../services/kitchen.service';

const TABS: { key: KitchenStatus; label: string }[] = [
  { key: 'placed', label: 'Placed' },
  { key: 'preparing', label: 'Preparing' },
  { key: 'ready', label: 'Ready' },
];

const EMPTY_TEXT: Record<KitchenStatus, string> = {
  placed: 'No new orders right now.',
  preparing: 'Nothing is being prepared.',
  ready: 'No orders waiting for pickup.',
};

const REFRESH_MS = 10000; // spec: queue refreshes every 10 seconds

type Props = {
  // Ready -> picked_up needs the pickup code, so that button opens the Pickup tab.
  onPickup: (orderId: number) => void;
};

export default function KitchenQueueScreen({ onPickup }: Props) {
  const [status, setStatus] = useState<KitchenStatus>('placed');
  const [refreshing, setRefreshing] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['kitchenOrders', status],
    queryFn: () => getKitchenOrders(status),
    refetchInterval: REFRESH_MS,
  });

  const advance = useMutation({
    mutationFn: ({ id, to }: { id: number; to: 'preparing' | 'ready' }) =>
      advanceOrder(id, to),
    onError: error => Alert.alert('Could not update order', getErrorMessage(error)),
    // Success or failure, reload so the screen matches the server.
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['kitchenOrders'] }),
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const renderOrder = ({ item }: { item: KitchenOrder }) => {
    const busy = advance.isPending && advance.variables?.id === item.id;
    const late = item.minutesSinceOrdered >= 15;

    let button: { label: string; onPress: () => void } | null = null;
    if (status === 'placed') {
      button = {
        label: 'Start preparing',
        onPress: () => advance.mutate({ id: item.id, to: 'preparing' }),
      };
    } else if (status === 'preparing') {
      button = {
        label: 'Mark ready',
        onPress: () => advance.mutate({ id: item.id, to: 'ready' }),
      };
    } else {
      button = { label: 'Enter pickup code', onPress: () => onPickup(item.id) };
    }

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.orderId}>Order #{item.id}</Text>
          <Text style={[styles.minutes, late && styles.minutesLate]}>
            {item.minutesSinceOrdered} min ago
          </Text>
        </View>

        {item.items.map((line, index) => (
          <Text key={`${item.id}-${index}`} style={styles.itemLine}>
            {line.qty} × {line.name}
          </Text>
        ))}

        {item.note ? <Text style={styles.note}>📝 {item.note}</Text> : null}

        <TouchableOpacity
          style={[styles.button, advance.isPending && styles.buttonDisabled]}
          onPress={button.onPress}
          disabled={advance.isPending}
          activeOpacity={0.8}
        >
          {busy ? (
            <ActivityIndicator color="#FFF" size="small" />
          ) : (
            <Text style={styles.buttonText}>{button.label}</Text>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.tabs}>
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, status === tab.key && styles.tabActive]}
            onPress={() => setStatus(tab.key)}
            activeOpacity={0.8}
          >
            <Text
              style={[styles.tabText, status === tab.key && styles.tabTextActive]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color="#6F4E37" size="large" />
        </View>
      ) : isError && !data ? (
        <View style={styles.center}>
          <Text style={styles.stateText}>Could not load orders.</Text>
          <TouchableOpacity style={styles.retry} onPress={() => refetch()}>
            <Text style={styles.retryText}>Try again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {isError ? (
            <Text style={styles.banner}>
              Could not refresh. Showing the last orders we got.
            </Text>
          ) : null}
          <FlatList
            data={data}
            keyExtractor={order => String(order.id)}
            renderItem={renderOrder}
            contentContainerStyle={styles.list}
            refreshing={refreshing}
            onRefresh={onRefresh}
            ListEmptyComponent={
              <View style={styles.center}>
                <Text style={styles.stateText}>{EMPTY_TEXT[status]}</Text>
              </View>
            }
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F4F0' },
  tabs: {
    flexDirection: 'row',
    margin: 16,
    marginBottom: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 4,
  },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 9 },
  tabActive: { backgroundColor: '#6F4E37' },
  tabText: { fontSize: 14, fontWeight: '600', color: '#8A8A8A' },
  tabTextActive: { color: '#FFFFFF', fontWeight: '800' },
  list: { padding: 16, paddingTop: 8, flexGrow: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  stateText: { fontSize: 15, color: '#8A8A8A', fontWeight: '500' },
  retry: {
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#6F4E37',
  },
  retryText: { color: '#6F4E37', fontWeight: '700' },
  banner: {
    marginHorizontal: 16,
    marginBottom: 4,
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#FFF3CD',
    color: '#8A6D1D',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#6F4E37',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  orderId: { fontSize: 18, fontWeight: '800', color: '#2B2B2B' },
  minutes: { fontSize: 13, fontWeight: '700', color: '#8A8A8A' },
  minutesLate: { color: '#E74C3C' },
  itemLine: { fontSize: 15, color: '#2B2B2B', marginBottom: 3, fontWeight: '500' },
  note: {
    marginTop: 8,
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F7F4F0',
    fontSize: 13,
    color: '#4A4A4A',
  },
  button: {
    marginTop: 14,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#6F4E37',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: { backgroundColor: '#A39081' },
  buttonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700', letterSpacing: 0.4 },
});