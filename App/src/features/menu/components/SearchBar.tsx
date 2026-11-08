import React from 'react';
import {
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Search, X } from 'lucide-react-native';

import { colors, radii, spacing } from '../theme';

interface SearchBarProps {
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
}

export default function SearchBar({
  value,
  onChangeText,
  placeholder = 'Search chai, snacks and food...',
}: SearchBarProps) {
  return (
    <View style={styles.container}>
      <Search color={colors.muted} size={19} strokeWidth={2.2} />

      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.placeholder}
        autoCorrect={false}
        returnKeyType="search"
        selectionColor={colors.primary}
        accessibilityLabel="Search the canteen menu"
      />

      {value.length > 0 ? (
        <TouchableOpacity
          style={styles.clearButton}
          onPress={() => onChangeText('')}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Clear search"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <X color={colors.primaryDark} size={15} strokeWidth={2.4} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.input,
    backgroundColor: colors.primarySoft,
  },
  input: {
    flex: 1,
    height: '100%',
    padding: 0,
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  clearButton: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryBorder,
  },
});
