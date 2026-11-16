import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  getErrorMessage,
  getKitchenOrders,
  KitchenOrder,
  pickupOrder,
} from '../services/kitchen.service';

type Props = {
  selectedId: number | null;
  onSelect: (orderId: number | null) => void;
};

export default function KitchenPickupScreen({ selectedId, onSelect }: Props) {
  const [code, setCode] = useState('');
  const queryClient = useQueryClient();

  // Same query key as the Ready tab, so both screens share one cached list.
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['kitchenOrders', 'ready'],
    queryFn: () => getKitchenOrders('ready'),
    refetchInterval: 10000,
  });

  const pickup = useMutation({
    mutationFn: ({ id, pickupCode }: { id: number; pickupCode: string }) =>
      pickupOrder(id, pickupCode),
    onSuccess: (_result, { id }) => {
      Alert.alert('Picked up', `Order #${id} handed over.`);
      setCode('');
      onSelect(null);
      queryClient.invalidateQueries({ queryKey: ['kitchenOrders'] });
    },
    onError: error => {
      // Wrong code, or the order is no longer ready: show the server's message.
      Alert.alert('Could not mark as picked up', getErrorMessage(error));
      setCode('');
      queryClient.invalidateQueries({ queryKey: ['kitchenOrders'] });
    },
  });

  // If another screen already picked the order up, it is no longer in the list.
  const selected = data?.find(order => order.id === selectedId) ?? null;

  const choose = (order: KitchenOrder) => {
    setCode('');
    onSelect(order.id);
  };

  const submit = () => {
    if (!selected) {
      return;
    }
    if (!/^\d{4}$/.test(code)) {
      Alert.alert('Invalid code', 'The pickup code is exactly 4 digits.');
      return;
    }
    pickup.mutate({ id: selected.id, pickupCode: code });
  };

  const renderOrder = ({ item }: { item: KitchenOrder }) => {
    const active = item.id === selected?.id;
    return (
      <TouchableOpacity
        style={[styles.row, active && styles.rowActive]}
        onPress={() => choose(item)}
        activeOpacity={0.8}
      >
        <Text style={styles.rowTitle}>Order #{item.id}</Text>
        <Text style={styles.rowSub} numberOfLines={1}>
          {item.items.map(line => `${line.qty} × ${line.name}`).join(', ')}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Pick an order, then enter its code</Text>

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
        <FlatList
          data={data}
          keyExtractor={order => String(order.id)}
          renderItem={renderOrder}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.stateText}>No orders waiting for pickup.</Text>
            </View>
          }
        />
      )}

      {selected ? (
        <View style={styles.codeBox}>
          <Text style={styles.codeLabel}>Pickup code for order #{selected.id}</Text>
          <TextInput
            style={styles.codeInput}
            placeholder="0 0 0 0"
            placeholderTextColor="#A0A0A0"
            keyboardType="number-pad"
            maxLength={4}
            value={code}
            onChangeText={setCode}
            editable={!pickup.isPending}
          />
          <TouchableOpacity
            style={[styles.button, pickup.isPending && styles.buttonDisabled]}
            onPress={submit}
            disabled={pickup.isPending}
            activeOpacity={0.8}
          >
            {pickup.isPending ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <Text style={styles.buttonText}>Mark as picked up</Text>
            )}
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F4F0' },
  heading: {
    fontSize: 13,
    fontWeight: '700',
    color: '#8A8A8A',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    margin: 16,
    marginBottom: 8,
  },
  list: { padding: 16, paddingTop: 4, flexGrow: 1 },
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
  row: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  rowActive: { borderColor: '#6F4E37' },
  rowTitle: { fontSize: 16, fontWeight: '800', color: '#2B2B2B' },
  rowSub: { fontSize: 13, color: '#8A8A8A', marginTop: 3 },
  codeBox: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 6,
  },
  codeLabel: { fontSize: 14, fontWeight: '700', color: '#4A4A4A', marginBottom: 8 },
  codeInput: {
    borderWidth: 1.5,
    borderColor: '#EAEAEA',
    borderRadius: 12,
    padding: 14,
    fontSize: 22,
    letterSpacing: 8,
    fontWeight: '700',
    textAlign: 'center',
    color: '#2B2B2B',
    backgroundColor: '#FAFAFA',
    marginBottom: 12,
  },
  button: {
    height: 52,
    borderRadius: 12,
    backgroundColor: '#6F4E37',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: { backgroundColor: '#A39081' },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700', letterSpacing: 0.4 },
});