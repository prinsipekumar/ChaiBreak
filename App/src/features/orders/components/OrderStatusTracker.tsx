import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing } from '../../menu/theme';
import { normalizeOrderStatus } from '../orderStatus';
import type { OrderStatus } from '../types';

interface OrderStatusTrackerProps {
  status: OrderStatus | string;
}

const STEPS: Array<{ status: OrderStatus; label: string }> = [
  { status: 'placed', label: 'Placed' },
  { status: 'preparing', label: 'Preparing' },
  { status: 'ready', label: 'Ready' },
  { status: 'picked_up', label: 'Picked up' },
];

export default function OrderStatusTracker({
  status,
}: OrderStatusTrackerProps) {
  const normalized = normalizeOrderStatus(status);

  if (normalized === 'cancelled') {
    return (
      <View style={styles.cancelledContainer}>
        <Text style={styles.cancelledTitle}>Order cancelled</Text>
        <Text style={styles.cancelledMessage}>
          This order will not be prepared or picked up.
        </Text>
      </View>
    );
  }

  const currentIndex = STEPS.findIndex(step => step.status === normalized);

  return (
    <View style={styles.container}>
      {STEPS.map((step, index) => {
        const isComplete = index <= currentIndex;
        const isCurrent = index === currentIndex;

        return (
          <React.Fragment key={step.status}>
            {index > 0 ? (
              <View
                style={[
                  styles.connector,
                  index <= currentIndex && styles.connectorComplete,
                ]}
              />
            ) : null}

            <View style={styles.step}>
              <View
                style={[
                  styles.dot,
                  isComplete && styles.dotComplete,
                  isCurrent && styles.dotCurrent,
                ]}
              >
                <Text
                  style={[
                    styles.dotText,
                    isComplete && styles.dotTextComplete,
                  ]}
                >
                  {index < currentIndex ? '✓' : index + 1}
                </Text>
              </View>
              <Text
                style={[
                  styles.stepLabel,
                  isComplete && styles.stepLabelComplete,
                ]}
              >
                {step.label}
              </Text>
            </View>
          </React.Fragment>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  step: {
    width: 62,
    alignItems: 'center',
  },
  dot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.primaryBorder,
  },
  dotComplete: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  dotCurrent: {
    backgroundColor: colors.primaryDark,
    borderColor: colors.primaryDark,
  },
  dotText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.muted,
  },
  dotTextComplete: {
    color: colors.surface,
  },
  connector: {
    flex: 1,
    height: 2,
    marginTop: 13,
    backgroundColor: colors.divider,
  },
  connectorComplete: {
    backgroundColor: colors.primary,
  },
  stepLabel: {
    marginTop: spacing.sm,
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
    color: colors.muted,
  },
  stepLabelComplete: {
    color: colors.primaryDark,
    fontWeight: '800',
  },
  cancelledContainer: {
    padding: spacing.lg,
    borderRadius: 14,
    backgroundColor: '#FDECEA',
  },
  cancelledTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#C62828',
  },
  cancelledMessage: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '500',
    color: '#9A4A44',
  },
});
