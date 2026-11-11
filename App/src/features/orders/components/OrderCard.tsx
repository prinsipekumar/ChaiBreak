import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { cardShadow, colors, radii, spacing } from '../../menu/theme';
import {
  formatOrderDate,
  formatPrice,
  getOrderItemCount,
  getOrderStatusColors,
  getOrderStatusLabel,
} from '../orderStatus';
import type { Order } from '../types';
import PickupCode from './PickupCode';

interface OrderCardProps {
  order: Order;
  onPress?: (order: Order) => void;
}

export default function OrderCard({ order, onPress }: OrderCardProps) {
  const statusColors = getOrderStatusColors(order.status);
  const itemCount = getOrderItemCount(order);
  const names = order.items
    .slice(0, 2)
    .map(item => `${item.quantity}× ${item.name}`)
    .join(', ');
  const remainingItems = Math.max(order.items.length - 2, 0);

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress?.(order)}
      activeOpacity={0.82}
      accessibilityRole="button"
      accessibilityLabel={`Order ${order.id}, ${getOrderStatusLabel(order.status)}`}
    >
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.orderNumber}>{`Order #${order.id}`}</Text>
          <Text style={styles.date}>{formatOrderDate(order.createdAt)}</Text>
        </View>

        <View
          style={[styles.statusBadge, { backgroundColor: statusColors.background }]}
        >
          <Text style={[styles.statusText, { color: statusColors.text }]}>
            {getOrderStatusLabel(order.status)}
          </Text>
        </View>
      </View>

      <View style={styles.body}>
        <View style={styles.itemSummary}>
          <Text style={styles.itemNames} numberOfLines={2}>
            {names || 'No items listed'}
            {remainingItems > 0 ? ` +${remainingItems} more` : ''}
          </Text>
          <Text style={styles.itemCount}>
            {itemCount} {itemCount === 1 ? 'item' : 'items'}
          </Text>
        </View>

        <PickupCode code={order.pickupCode} compact />
      </View>

      <View style={styles.footer}>
        <View>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>{formatPrice(order.totalAmount)}</Text>
        </View>
        <Text style={styles.viewDetails}>View details →</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.lg,
    borderRadius: radii.card,
    backgroundColor: colors.surface,
    ...cardShadow,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  headerText: {
    flex: 1,
    paddingRight: spacing.sm,
  },
  orderNumber: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
  },
  date: {
    marginTop: 3,
    fontSize: 10.5,
    fontWeight: '500',
    color: colors.muted,
  },
  statusBadge: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  body: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  itemSummary: {
    flex: 1,
    paddingRight: spacing.md,
  },
  itemNames: {
    fontSize: 12.5,
    lineHeight: 18,
    fontWeight: '600',
    color: colors.text,
  },
  itemCount: {
    marginTop: 4,
    fontSize: 10.5,
    fontWeight: '600',
    color: colors.muted,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  totalLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: colors.muted,
  },
  totalValue: {
    marginTop: 2,
    fontSize: 17,
    fontWeight: '900',
    color: colors.primaryDark,
  },
  viewDetails: {
    fontSize: 11.5,
    fontWeight: '800',
    color: colors.primary,
  },
});
