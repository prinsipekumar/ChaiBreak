import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import {
  ClipboardList,
  ShoppingCart,
  UserRound,
  UtensilsCrossed,
  type LucideIcon,
} from 'lucide-react-native';

import { colors } from '../theme';

export type BottomTab = 'menu' | 'orders' | 'cart' | 'profile';

interface BottomNavProps {
  activeTab: BottomTab;
  cartCount?: number;
  onSelect?: (tab: BottomTab) => void;
}

interface NavItem {
  key: BottomTab;
  label: string;
  Icon: LucideIcon;
}

const NAV_ITEMS: NavItem[] = [
  { key: 'menu', label: 'Menu', Icon: UtensilsCrossed },
  { key: 'orders', label: 'My Orders', Icon: ClipboardList },
  { key: 'cart', label: 'Cart', Icon: ShoppingCart },
  { key: 'profile', label: 'Profile', Icon: UserRound },
];

export default function BottomNav({
  activeTab,
  cartCount = 0,
  onSelect,
}: BottomNavProps) {
  return (
    <View style={styles.container}>
      {NAV_ITEMS.map(({ key, label, Icon }) => {
        const isActive = key === activeTab;
        const iconColor = isActive ? colors.primary : colors.muted;

        return (
          <TouchableOpacity
            key={key}
            style={styles.item}
            onPress={() => onSelect?.(key)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={label}
          >
            <View style={[styles.iconWrap, isActive && styles.iconWrapActive]}>
              <Icon
                color={iconColor}
                size={21}
                strokeWidth={isActive ? 2.4 : 2}
              />

              {key === 'cart' && cartCount > 0 ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {cartCount > 9 ? '9+' : cartCount}
                  </Text>
                </View>
              ) : null}
            </View>

            <Text style={[styles.label, isActive && styles.labelActive]}>
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 6,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 12,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  iconWrap: {
    width: 38,
    height: 27,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9,
  },
  iconWrapActive: {
    backgroundColor: colors.primarySoft,
  },
  label: {
    fontSize: 9.5,
    fontWeight: '600',
    letterSpacing: 0.1,
    color: colors.muted,
  },
  labelActive: {
    fontWeight: '800',
    color: colors.primary,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -7,
    minWidth: 17,
    height: 17,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: colors.surface,
    backgroundColor: colors.primaryDark,
  },
  badgeText: {
    fontSize: 8.5,
    fontWeight: '800',
    color: colors.surface,
  },
});
