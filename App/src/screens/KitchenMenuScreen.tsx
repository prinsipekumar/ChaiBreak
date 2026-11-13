import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  getErrorMessage,
  getKitchenItems,
  KitchenItem,
  updateItem,
} from '../services/kitchen.service';

const MAX_STOCK = 10000; // same limit the server enforces

type RowProps = {
  item: KitchenItem;
  saving: boolean;
  onToggle: (isAvailable: boolean) => void;
  onSaveStock: (stockLeft: number) => void;
};

function ItemRow({ item, saving, onToggle, onSaveStock }: RowProps) {
  const [draft, setDraft] = useState(String(item.stockLeft));

  // When the server value changes (save or refresh), show it in the box.
  useEffect(() => {
    setDraft(String(item.stockLeft));
  }, [item.stockLeft]);

  const isWholeNumber = /^\d+$/.test(draft);
  const value = isWholeNumber ? Number(draft) : NaN;
  const valid = isWholeNumber && value <= MAX_STOCK;
  const changed = valid && value !== item.stockLeft;

  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={styles.cardInfo}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.meta}>
            {item.category} · ₹{item.priceRupees}
          </Text>
        </View>
        <View style={styles.switchBox}>
          <Text style={[styles.switchLabel, !item.isAvailable && styles.off]}>
            {item.isAvailable ? 'Available' : 'Unavailable'}
          </Text>
          <Switch
            value={item.isAvailable}
            onValueChange={onToggle}
            disabled={saving}
            trackColor={{ false: '#D0C8C0', true: '#B89B85' }}
            thumbColor={item.isAvailable ? '#6F4E37' : '#F4F4F4'}
          />
        </View>
      </View>

      <View style={styles.stockRow}>
        <Text style={styles.stockLabel}>Stock left</Text>
        <TextInput
          style={[styles.stockInput, !valid && styles.stockInvalid]}
          keyboardType="number-pad"
          maxLength={5}
          value={draft}
          onChangeText={setDraft}
          editable={!saving}
        />
        <TouchableOpacity
          style={[styles.saveButton, (!changed || saving) && styles.saveDisabled]}
          onPress={() => onSaveStock(value)}
          disabled={!changed || saving}
          activeOpacity={0.8}
        >
          {saving ? (
            <ActivityIndicator color="#FFF" size="small" />
          ) : (
            <Text style={styles.saveText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function KitchenMenuScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['kitchenItems'],
    queryFn: getKitchenItems,
  });

  const update = useMutation({
    mutationFn: ({
      id,
      changes,
    }: {
      id: number;
      changes: { isAvailable?: boolean; stockLeft?: number };
    }) => updateItem(id, changes),
    onError: error => Alert.alert('Could not update item', getErrorMessage(error)),
    // Success or failure, reload so the screen matches the server.
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['kitchenItems'] }),
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  return (
    <View style={styles.container}>
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color="#6F4E37" size="large" />
        </View>
      ) : isError && !data ? (
        <View style={styles.center}>
          <Text style={styles.stateText}>Could not load the menu.</Text>
          <TouchableOpacity style={styles.retry} onPress={() => refetch()}>
            <Text style={styles.retryText}>Try again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item: KitchenItem) => String(item.id)}
          contentContainerStyle={styles.list}
          refreshing={refreshing}
          onRefresh={onRefresh}
          renderItem={({ item }: { item: KitchenItem }) => (
            <ItemRow
              item={item}
              saving={update.isPending && update.variables?.id === item.id}
              onToggle={isAvailable =>
                update.mutate({ id: item.id, changes: { isAvailable } })
              }
              onSaveStock={stockLeft =>
                update.mutate({ id: item.id, changes: { stockLeft } })
              }
            />
          )}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.stateText}>No menu items yet.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F4F0' },
  list: { padding: 16, flexGrow: 1 },
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
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardInfo: { flex: 1, paddingRight: 12 },
  name: { fontSize: 17, fontWeight: '800', color: '#2B2B2B' },
  meta: { fontSize: 13, color: '#8A8A8A', marginTop: 2, fontWeight: '500' },
  switchBox: { alignItems: 'center' },
  switchLabel: { fontSize: 11, fontWeight: '700', color: '#6F4E37', marginBottom: 2 },
  off: { color: '#E74C3C' },
  stockRow: { flexDirection: 'row', alignItems: 'center', marginTop: 14 },
  stockLabel: { fontSize: 14, fontWeight: '600', color: '#4A4A4A', flex: 1 },
  stockInput: {
    width: 80,
    borderWidth: 1.5,
    borderColor: '#EAEAEA',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    color: '#2B2B2B',
    backgroundColor: '#FAFAFA',
  },
  stockInvalid: { borderColor: '#E74C3C' },
  saveButton: {
    marginLeft: 10,
    height: 40,
    minWidth: 70,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: '#6F4E37',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveDisabled: { backgroundColor: '#CFC4BA' },
  saveText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
});
