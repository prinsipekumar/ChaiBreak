import React from 'react';
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import type { MenuItem } from '../data/menuData';
import { cardShadow, colors, radii, spacing } from '../theme';

interface ItemCardProps {
  item: MenuItem;
  width: number;
  onPress?: (item: MenuItem) => void;
}

export default function ItemCard({ item, width, onPress }: ItemCardProps) {
  const isSoldOut = Boolean(item.isSoldOut);
  const indicatorColor = item.isVeg ? colors.veg : colors.nonVeg;

  const handlePress = () => {
    if (isSoldOut) {
      return;
    }
    onPress?.(item);
  };

  return (
    <View
      style={[styles.shadow, { width }, isSoldOut && styles.cardSoldOut]}
    >
      <TouchableOpacity
        style={styles.card}
        onPress={handlePress}
        disabled={isSoldOut}
        activeOpacity={0.9}
        accessibilityRole="button"
        accessibilityLabel={
          isSoldOut
            ? `${item.name}, sold out`
            : `${item.name}, ₹${item.price}. View details`
        }
      >
        <View style={styles.imageWrapper}>
          <Image
            source={item.image}
            style={[styles.image, isSoldOut && styles.imageSoldOut]}
            resizeMode="cover"
            accessibilityIgnoresInvertColors
          />

          {isSoldOut ? <View style={styles.imageMutedOverlay} /> : null}

          <View
            style={[styles.vegIndicator, { borderColor: indicatorColor }]}
            accessibilityLabel={item.isVeg ? 'Vegetarian' : 'Non-vegetarian'}
          >
            <View
              style={[styles.vegIndicatorDot, { backgroundColor: indicatorColor }]}
            />
          </View>

          {isSoldOut ? (
            <View style={styles.soldOutBadge}>
              <Text style={styles.soldOutBadgeText}>SOLD OUT</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.content}>
          <Text style={styles.name} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={styles.description} numberOfLines={2}>
            {item.description}
          </Text>

          <View style={styles.footer}>
            <Text style={styles.price}>₹{item.price}</Text>

            <TouchableOpacity
              style={[styles.addButton, isSoldOut && styles.addButtonDisabled]}
              onPress={handlePress}
              disabled={isSoldOut}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityState={{ disabled: isSoldOut }}
              accessibilityLabel={
                isSoldOut ? `${item.name} is sold out` : `Add ${item.name}`
              }
            >
              <Text
                style={[
                  styles.addButtonText,
                  isSoldOut && styles.addButtonTextDisabled,
                ]}
              >
                {isSoldOut ? 'Sold Out' : 'Add'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  shadow: {
    borderRadius: radii.card,
    backgroundColor: colors.surface,
    ...cardShadow,
  },
  cardSoldOut: {
    opacity: 0.6,
  },
  card: {
    flex: 1,
    overflow: 'hidden',
    borderRadius: radii.card,
    backgroundColor: colors.surface,
  },
  imageWrapper: {
    width: '100%',
    aspectRatio: 4 / 3,
    backgroundColor: colors.primarySoft,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageSoldOut: {
    filter: [{ grayscale: 1 }],
    opacity: 0.85,
  },
  imageMutedOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(120, 112, 108, 0.14)',
  },
  vegIndicator: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    shadowColor: '#3E2723',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 2,
    elevation: 1,
  },
  vegIndicatorDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  soldOutBadge: {
    position: 'absolute',
    right: spacing.sm,
    bottom: spacing.sm,
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 5,
    backgroundColor: 'rgba(62, 39, 35, 0.88)',
  },
  soldOutBadgeText: {
    fontSize: 7.5,
    fontWeight: '800',
    letterSpacing: 0.6,
    color: colors.surface,
  },
  content: {
    flex: 1,
    padding: spacing.md,
  },
  name: {
    fontSize: 14.5,
    fontWeight: '800',
    letterSpacing: -0.2,
    color: colors.text,
  },
  description: {
    minHeight: 32,
    marginTop: 4,
    fontSize: 11.5,
    lineHeight: 16,
    fontWeight: '500',
    color: colors.muted,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  price: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
    color: colors.primaryDark,
  },
  addButton: {
    minWidth: 58,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 11,
    borderRadius: radii.button,
    borderWidth: 1.2,
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  addButtonDisabled: {
    borderColor: colors.soldOutButtonBorder,
    backgroundColor: colors.soldOutButtonBg,
  },
  addButtonText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: colors.primaryDark,
    letterSpacing: 0.1,
  },
  addButtonTextDisabled: {
    fontSize: 10.5,
    fontWeight: '700',
    color: colors.soldOutButtonText,
  },
});
