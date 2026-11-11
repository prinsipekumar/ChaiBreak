import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import EmptyState from '../features/menu/components/EmptyState';
import { colors, radii, spacing } from '../features/menu/theme';
import OrderCard from '../features/orders/components/OrderCard';
import { useMyOrders } from '../features/orders/hooks/useOrders';
import { getOrderErrorMessage } from '../features/orders/ordersApi';
import { splitOrders } from '../features/orders/orderStatus';
import type { Order } from '../features/orders/types';

interface MyOrdersScreenProps {
  onOpenOrder?: (orderId: number) => void;
}

interface OrderSectionProps {
  title: string;
  hint: string;
  orders: Order[];
  emptyMessage: string;
  onOpenOrder?: (orderId: number) => void;
}

function OrderSection({
  title,
  hint,
  orders,
  emptyMessage,
  onOpenOrder,
}: OrderSectionProps) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleWrap}>
          <Text style={styles.sectionTitle}>{title}</Text>
          <Text style={styles.sectionHint}>{hint}</Text>
        </View>
        <View style={styles.sectionCount}>
          <Text style={styles.sectionCountText}>{orders.length}</Text>
        </View>
      </View>

      {orders.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyCardText}>{emptyMessage}</Text>
        </View>
      ) : (
        <View style={styles.orderList}>
          {orders.map(order => (
            <OrderCard
              key={order.id}
              order={order}
              onPress={selectedOrder =>
                onOpenOrder?.(selectedOrder.id)
              }
            />
          ))}
        </View>
      )}
    </View>
  );
}

export default function MyOrdersScreen({ onOpenOrder }: MyOrdersScreenProps) {
  const { data, isLoading, isError, error, refetch } = useMyOrders();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const orders = data ?? [];

  const handleRefresh = useCallback(() => {
    if (isRefreshing) {
      return;
    }

    setIsRefreshing(true);
    refetch().finally(() => setIsRefreshing(false));
  }, [isRefreshing, refetch]);

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading your orders…</Text>
      </View>
    );
  }

  if (isError && orders.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorIcon}>🧾</Text>
        <Text style={styles.errorTitle}>Orders unavailable</Text>
        <Text style={styles.errorMessage}>
          {getOrderErrorMessage(error) ||
            'We could not load your orders. Please try again.'}
        </Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={handleRefresh}
          activeOpacity={0.8}
        >
          <Text style={styles.retryButtonText}>Try again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const { activeOrders, historyOrders } = splitOrders(orders);

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
        <View style={styles.intro}>
          <Text style={styles.title}>My Orders</Text>
          <Text style={styles.subtitle}>
            Live kitchen updates appear automatically while an order is active.
          </Text>
        </View>

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

        {orders.length === 0 ? (
          <EmptyState
            title="No orders yet"
            message="Orders you place will appear here with live kitchen status."
            actionLabel="Refresh"
            onAction={handleRefresh}
          />
        ) : (
          <>
            <OrderSection
              title="Active Orders"
              hint="ON THE WAY"
              orders={activeOrders}
              emptyMessage="No active orders right now."
              onOpenOrder={onOpenOrder}
            />
            <OrderSection
              title="Order History"
              hint="COMPLETED"
              orders={historyOrders}
              emptyMessage="Your completed and cancelled orders will appear here."
              onOpenOrder={onOpenOrder}
            />
          </>
        )}
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
  intro: {
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.5,
    color: colors.text,
  },
  subtitle: {
    marginTop: 4,
    maxWidth: 320,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '500',
    color: colors.muted,
  },
  section: {
    marginBottom: spacing.xxl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  sectionTitleWrap: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.text,
  },
  sectionHint: {
    marginTop: 2,
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 1.1,
    color: colors.primary,
  },
  sectionCount: {
    minWidth: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
  },
  sectionCountText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  orderList: {
    gap: spacing.md,
  },
  emptyCard: {
    padding: spacing.lg,
    borderRadius: radii.card,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.primaryBorder,
    backgroundColor: colors.surface,
  },
  emptyCardText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.muted,
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
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
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
