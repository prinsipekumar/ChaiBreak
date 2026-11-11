import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { colors, cardShadow, radii, spacing } from '../features/menu/theme';
import OrderItemsList from '../features/orders/components/OrderItemsList';
import OrderStatusTracker from '../features/orders/components/OrderStatusTracker';
import PickupCode from '../features/orders/components/PickupCode';
import {
  useCancelOrder,
  useOrderDetails,
} from '../features/orders/hooks/useOrders';
import { getOrderErrorMessage } from '../features/orders/ordersApi';
import {
  formatOrderDate,
  formatPrice,
  getOrderStatusColors,
  getOrderStatusLabel,
  isActiveOrderStatus,
  isCancellableOrderStatus,
} from '../features/orders/orderStatus';

interface OrderDetailsScreenProps {
  orderId: number;
  onBack?: () => void;
}

export default function OrderDetailsScreen({
  orderId,
  onBack,
}: OrderDetailsScreenProps) {
  const { data: order, isLoading, isError, error, refetch } =
    useOrderDetails(orderId);
  const cancelMutation = useCancelOrder(orderId);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = useCallback(() => {
    if (isRefreshing) {
      return;
    }

    setIsRefreshing(true);
    refetch().finally(() => setIsRefreshing(false));
  }, [isRefreshing, refetch]);

  const handleCancel = useCallback(() => {
    if (!order || cancelMutation.isPending) {
      return;
    }

    Alert.alert(
      'Cancel this order?',
      'Your items will be returned to stock. This cannot be undone.',
      [
        { text: 'Keep order', style: 'cancel' },
        {
          text: 'Cancel order',
          style: 'destructive',
          onPress: () =>
            cancelMutation.mutate(undefined, {
              onSuccess: () =>
                Alert.alert(
                  'Order cancelled',
                  'Your order was cancelled and the stock was restored.',
                ),
              onError: cancelError =>
                Alert.alert(
                  'Unable to cancel order',
                  getOrderErrorMessage(cancelError),
                ),
            }),
        },
      ],
    );
  }, [cancelMutation, order]);

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading order details…</Text>
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorIcon}>🧾</Text>
        <Text style={styles.errorTitle}>Order unavailable</Text>
        <Text style={styles.errorMessage}>
          {getOrderErrorMessage(error) ||
            'We could not load this order. Please try again.'}
        </Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={handleRefresh}
          activeOpacity={0.8}
        >
          <Text style={styles.retryButtonText}>Try again</Text>
        </TouchableOpacity>
        {onBack ? (
          <TouchableOpacity
            style={styles.backLink}
            onPress={onBack}
            activeOpacity={0.8}
          >
            <Text style={styles.backLinkText}>Back to My Orders</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    );
  }

  const statusColors = getOrderStatusColors(order.status);
  const itemTotal = order.items.reduce(
    (total, item) => total + item.price * item.quantity,
    0,
  );
  const visibleNote =
    order.note && !order.note.startsWith('F5-SEED:') ? order.note : null;
  const isActive = isActiveOrderStatus(order.status);
  const canCancel = isCancellableOrderStatus(order.status);

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
            progressBackgroundColor={colors.surface}
          />
        }
      >
        {onBack ? (
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            activeOpacity={0.7}
          >
            <Text style={styles.backButtonText}>← My Orders</Text>
          </TouchableOpacity>
        ) : null}

        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.title}>Order #{order.id}</Text>
            <Text style={styles.date}>{formatOrderDate(order.createdAt)}</Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: statusColors.background },
            ]}
          >
            <Text style={[styles.statusText, { color: statusColors.text }]}>
              {getOrderStatusLabel(order.status)}
            </Text>
          </View>
        </View>

        <PickupCode code={order.pickupCode} />

        {isActive ? (
          <Text style={styles.pollingHint}>
            Live status refreshes automatically every 5 seconds.
          </Text>
        ) : null}

        {isError ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>
              {getOrderErrorMessage(error)}
            </Text>
            <TouchableOpacity onPress={handleRefresh} activeOpacity={0.8}>
              <Text style={styles.errorBannerAction}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Order Status</Text>
          <OrderStatusTracker status={order.status} />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Order Items</Text>
          <OrderItemsList items={order.items} />
        </View>

        <View style={styles.card}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Item total</Text>
            <Text style={styles.totalAmount}>{formatPrice(itemTotal)}</Text>
          </View>
          <View style={[styles.totalRow, styles.grandTotalRow]}>
            <Text style={styles.grandTotalLabel}>Total</Text>
            <Text style={styles.grandTotalValue}>
              {formatPrice(order.totalAmount)}
            </Text>
          </View>
        </View>

        {visibleNote ? (
          <View style={styles.noteCard}>
            <Text style={styles.noteLabel}>Note</Text>
            <Text style={styles.noteText}>{visibleNote}</Text>
          </View>
        ) : null}

        {canCancel ? (
          <TouchableOpacity
            style={[
              styles.cancelButton,
              cancelMutation.isPending && styles.cancelButtonDisabled,
            ]}
            onPress={handleCancel}
            disabled={cancelMutation.isPending}
            activeOpacity={0.8}
          >
            {cancelMutation.isPending ? (
              <ActivityIndicator color="#C62828" size="small" />
            ) : (
              <Text style={styles.cancelButtonText}>Cancel Order</Text>
            )}
          </TouchableOpacity>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.xl,
    paddingBottom: 40,
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingRight: spacing.md,
    marginBottom: spacing.md,
  },
  backButtonText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  headerText: {
    flex: 1,
    paddingRight: spacing.sm,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.5,
    color: colors.text,
  },
  date: {
    marginTop: 4,
    fontSize: 11,
    fontWeight: '500',
    color: colors.muted,
  },
  statusBadge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '800',
  },
  pollingHint: {
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
    textAlign: 'center',
    fontSize: 10.5,
    fontWeight: '600',
    color: colors.muted,
  },
  card: {
    marginTop: spacing.lg,
    padding: spacing.lg,
    borderRadius: radii.card,
    backgroundColor: colors.surface,
    ...cardShadow,
  },
  cardTitle: {
    marginBottom: spacing.md,
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 5,
  },
  totalLabel: {
    fontSize: 12.5,
    fontWeight: '500',
    color: colors.muted,
  },
  totalAmount: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  grandTotalRow: {
    marginTop: spacing.sm,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  grandTotalLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
  },
  grandTotalValue: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.primaryDark,
  },
  noteCard: {
    marginTop: spacing.lg,
    padding: spacing.lg,
    borderRadius: radii.card,
    backgroundColor: colors.primarySoft,
  },
  noteLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: colors.primary,
  },
  noteText: {
    marginTop: 4,
    fontSize: 12.5,
    lineHeight: 19,
    fontWeight: '500',
    color: colors.text,
  },
  cancelButton: {
    marginTop: spacing.xl,
    height: 50,
    borderRadius: radii.button,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#E74C3C',
    backgroundColor: colors.surface,
  },
  cancelButtonDisabled: {
    opacity: 0.6,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#C62828',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: 12,
    fontWeight: '600',
    color: colors.muted,
  },
  errorIcon: {
    fontSize: 42,
    marginBottom: spacing.md,
  },
  errorTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: colors.text,
  },
  errorMessage: {
    marginTop: 6,
    maxWidth: 280,
    textAlign: 'center',
    fontSize: 12.5,
    lineHeight: 19,
    fontWeight: '500',
    color: colors.muted,
  },
  retryButton: {
    marginTop: spacing.xl,
    height: 44,
    paddingHorizontal: spacing.xxl,
    borderRadius: radii.button,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
  retryButtonText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.surface,
  },
  backLink: {
    marginTop: spacing.md,
    padding: spacing.sm,
  },
  backLinkText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: 12,
    backgroundColor: '#FDECEA',
  },
  errorBannerText: {
    flex: 1,
    paddingRight: spacing.sm,
    fontSize: 11.5,
    fontWeight: '600',
    color: '#9A4A44',
  },
  errorBannerAction: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#C62828',
  },
});
