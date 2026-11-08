import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Circle, Ellipse, Path } from 'react-native-svg';

import { colors, radii, spacing } from '../theme';

interface EmptyStateProps {
  title?: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}

function ChaiCupIllustration() {
  return (
    <Svg width={168} height={168} viewBox="0 0 160 160">
      <Circle cx={80} cy={80} r={70} fill={colors.primarySoft} />

      <Circle cx={33} cy={45} r={4} fill={colors.primaryBorder} />
      <Circle cx={130} cy={54} r={5} fill={colors.primaryBorder} />
      <Circle cx={40} cy={118} r={3} fill={colors.primaryBorder} />
      <Circle cx={126} cy={119} r={3.5} fill={colors.primaryBorder} />

      <Path
        d="M62 43 C57 37 66 33 61 26"
        stroke="#C9B3A6"
        strokeWidth={4}
        strokeLinecap="round"
        fill="none"
      />
      <Path
        d="M80 40 C75 34 84 30 79 22"
        stroke="#C9B3A6"
        strokeWidth={4}
        strokeLinecap="round"
        fill="none"
      />
      <Path
        d="M98 43 C93 37 102 33 97 26"
        stroke="#C9B3A6"
        strokeWidth={4}
        strokeLinecap="round"
        fill="none"
      />

      <Ellipse cx={80} cy={123} rx={46} ry={9} fill="#EADFD5" />

      <Path
        d="M112 75 C126 74 131 84 129 93 C127 103 118 107 109 104"
        stroke={colors.primary}
        strokeWidth={4}
        strokeLinecap="round"
        fill="none"
      />

      <Path
        d="M46 65 H114 L107 112 Q106 121 97 121 H63 Q54 121 53 112 Z"
        fill={colors.surface}
        stroke={colors.primary}
        strokeWidth={4}
        strokeLinejoin="round"
      />

      <Ellipse
        cx={80}
        cy={65}
        rx={34}
        ry={8}
        fill="#C89A76"
        stroke={colors.primary}
        strokeWidth={4}
      />

      <Path
        d="M63 86 Q60 96 63 105"
        stroke={colors.primarySoft}
        strokeWidth={4}
        strokeLinecap="round"
        fill="none"
      />

      <Path
        d="M69 91 Q72 94 75 91"
        stroke={colors.primaryDark}
        strokeWidth={2.2}
        strokeLinecap="round"
        fill="none"
      />
      <Path
        d="M85 91 Q88 94 91 91"
        stroke={colors.primaryDark}
        strokeWidth={2.2}
        strokeLinecap="round"
        fill="none"
      />
      <Path
        d="M74 99 Q80 104 86 99"
        stroke={colors.primaryDark}
        strokeWidth={2.2}
        strokeLinecap="round"
        fill="none"
      />
      <Circle cx={64} cy={98} r={3} fill="#F0C8C3" />
      <Circle cx={96} cy={98} r={3} fill="#F0C8C3" />
    </Svg>
  );
}

export default function EmptyState({
  title = 'No items found',
  message = 'Try a different search or clear your filters.',
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <ChaiCupIllustration />

      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>

      {actionLabel && onAction ? (
        <TouchableOpacity
          style={styles.actionButton}
          onPress={onAction}
          activeOpacity={0.8}
          accessibilityRole="button"
        >
          <Text style={styles.actionButtonText}>{actionLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: 36,
    paddingBottom: 48,
  },
  title: {
    marginTop: spacing.lg,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.2,
    color: colors.text,
  },
  message: {
    marginTop: 6,
    maxWidth: 250,
    textAlign: 'center',
    fontSize: 12.5,
    lineHeight: 19,
    fontWeight: '500',
    color: colors.muted,
  },
  actionButton: {
    marginTop: spacing.xl,
    height: 42,
    justifyContent: 'center',
    paddingHorizontal: 24,
    borderRadius: radii.button,
    backgroundColor: colors.primary,
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.14,
    shadowRadius: 6,
    elevation: 2,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.surface,
    letterSpacing: 0.2,
  },
});
