import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing } from '../../menu/theme';

interface PickupCodeProps {
  code: string;
  compact?: boolean;
}

export default function PickupCode({ code, compact = false }: PickupCodeProps) {
  return (
    <View style={[styles.container, compact && styles.containerCompact]}>
      <Text style={[styles.label, compact && styles.labelCompact]}>
        Pickup Code
      </Text>
      <Text style={[styles.code, compact && styles.codeCompact]}>{code}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    borderRadius: radii.card,
    backgroundColor: colors.primarySoft,
    borderWidth: 1.5,
    borderColor: colors.primaryBorder,
    borderStyle: 'dashed',
  },
  containerCompact: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
  },
  label: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: colors.primary,
  },
  labelCompact: {
    fontSize: 9,
    letterSpacing: 1,
  },
  code: {
    marginTop: 4,
    fontSize: 38,
    fontWeight: '900',
    letterSpacing: 6,
    color: colors.primaryDark,
  },
  codeCompact: {
    marginTop: 1,
    fontSize: 20,
    letterSpacing: 3,
  },
});
