import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing } from '../../menu/theme';
import { formatPrice } from '../orderStatus';
import type { OrderItem } from '../types';

interface OrderItemsListProps {
  items: OrderItem[];
}

export default function OrderItemsList({ items }: OrderItemsListProps) {
  return (
    <View style={styles.container}>
      {items.map(item => (
        <View key={item.id} style={styles.row}>
          <View style={styles.quantityWrap}>
            <Text style={styles.quantity}>{item.quantity}×</Text>
          </View>

          <View style={styles.nameWrap}>
            <Text style={styles.name} numberOfLines={2}>
              {item.name}
            </Text>
            <Text style={styles.unitPrice}>{formatPrice(item.price)} each</Text>
          </View>

          <Text style={styles.lineTotal}>
            {formatPrice(item.price * item.quantity)}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
  },
  quantity: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  nameWrap: {
    flex: 1,
    marginLeft: spacing.md,
  },
  name: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  unitPrice: {
    marginTop: 2,
    fontSize: 11,
    fontWeight: '500',
    color: colors.muted,
  },
  lineTotal: {
    marginLeft: spacing.md,
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
  },
});
