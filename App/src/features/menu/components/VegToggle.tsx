import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { colors } from '../theme';

interface VegToggleProps {
  value: boolean;
  onChange: (value: boolean) => void;
}

export default function VegToggle({ value, onChange }: VegToggleProps) {
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onChange(!value)}
      activeOpacity={0.8}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      accessibilityLabel="Show vegetarian items only"
    >
      <View style={styles.vegMark}>
        <View style={styles.vegDot} />
      </View>
      <Text style={styles.label}>Veg</Text>

      <View style={[styles.track, value && styles.trackOn]}>
        <View style={[styles.thumb, value && styles.thumbOn]} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  vegMark: {
    width: 16,
    height: 16,
    borderRadius: 3,
    borderWidth: 1.5,
    borderColor: colors.veg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  vegDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.veg,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
    marginRight: 2,
  },
  track: {
    width: 42,
    height: 24,
    borderRadius: 12,
    padding: 3,
    justifyContent: 'center',
    backgroundColor: colors.switchTrackOff,
  },
  trackOn: {
    backgroundColor: colors.veg,
  },
  thumb: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.surface,
    shadowColor: '#3E2723',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.16,
    shadowRadius: 2,
    elevation: 2,
  },
  thumbOn: {
    alignSelf: 'flex-end',
  },
});
