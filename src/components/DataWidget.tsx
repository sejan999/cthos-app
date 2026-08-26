import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GlassCard } from './GlassCard';
import { theme } from '../theme';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

interface DataWidgetProps {
  icon: IoniconName;
  label: string;
  value: string;
  sub?: string;
  accent?: string;
}

/**
 * DataWidget — the compact live-data tile for Weather / Date / Mood on the
 * Dashboard. A small glass panel with an icon, a primary value and a subline.
 */
export function DataWidget({ icon, label, value, sub, accent }: DataWidgetProps) {
  const tint = accent ?? theme.palette.neon.primary;
  return (
    <GlassCard style={styles.card} subdued>
      <View style={styles.row}>
        <Ionicons name={icon} size={18} color={tint} />
        <Text style={styles.label}>{label}</Text>
      </View>
      <Text style={styles.value}>{value}</Text>
      {sub ? <Text style={styles.sub}>{sub}</Text> : null}
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    paddingVertical: theme.spacing.sm + 2,
    paddingHorizontal: theme.spacing.sm,
    minHeight: 92,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  label: {
    color: theme.palette.text.low,
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  value: {
    color: theme.palette.text.high,
    fontSize: 20,
    fontWeight: '700',
    marginTop: 8,
  },
  sub: { color: theme.palette.text.mid, fontSize: 11, marginTop: 2 },
});