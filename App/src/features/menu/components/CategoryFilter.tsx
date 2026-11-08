import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
} from 'react-native';

import { MENU_CATEGORIES, type MenuCategory } from '../data/menuData';
import { colors, radii, spacing } from '../theme';

interface CategoryFilterProps {
  selected: MenuCategory;
  onSelect: (category: MenuCategory) => void;
}

export default function CategoryFilter({
  selected,
  onSelect,
}: CategoryFilterProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      {MENU_CATEGORIES.map(category => {
        const isActive = category === selected;

        return (
          <TouchableOpacity
            key={category}
            style={[styles.chip, isActive && styles.chipActive]}
            onPress={() => onSelect(category)}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={`${category} category`}
          >
            <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
              {category}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.xl,
    gap: 10,
  },
  chip: {
    height: 38,
    justifyContent: 'center',
    paddingHorizontal: 17,
    borderRadius: radii.chip,
    borderWidth: 1.2,
    borderColor: colors.primaryBorder,
    backgroundColor: colors.surface,
  },
  chipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  chipText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 0.1,
  },
  chipTextActive: {
    color: colors.surface,
  },
});
