import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

interface SettingsRowProps {
  icon: IoniconName;
  label: string;
  hint?: string;
  onPress?: () => void;
  last?: boolean;
}

/**
 * SettingsRow — one tappable line in a categorized settings group. Shows a
 * leading icon, label + optional hint, and a chevron affordance.
 */
export function SettingsRow({ icon, label, hint, onPress, last = false }: SettingsRowProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.row,
        last && styles.last,
        pressed && { backgroundColor: 'rgba(74,144,226,0.08)' },
      ]}
    >
      <View style={styles.iconWrap}>
        <Ionicons name={icon} size={18} color={theme.palette.neon.primary} />
      </View>
      <View style={styles.mid}>
        <Text style={styles.label}>{label}</Text>
        {hint ? <Text style={styles.hint}>{hint}</Text> : null}
      </View>
      <Ionicons name="chevron-forward" size={16} color={theme.palette.text.low} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(111,163,240,0.10)',
  },
  last: { borderBottomWidth: 0 },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(74,144,226,0.12)',
  },
  mid: { flex: 1 },
  label: { color: theme.palette.text.high, fontSize: 15, fontWeight: '600' },
  hint: { color: theme.palette.text.mid, fontSize: 12, marginTop: 2 },
});