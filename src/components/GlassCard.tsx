import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle, ViewProps } from 'react-native';
import { theme } from '../theme';

interface GlassCardProps extends ViewProps {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Use the neon accent border + glow for emphasis. */
  glow?: boolean;
  /** Reduce alpha for subtle cards. */
  subdued?: boolean;
}

/**
 * GlassCard — the core glassmorphism surface used across Cthos.
 * A translucent navy panel with a soft neon-blue hairline border, subtle
 * drop shadow and elevation. `backdropFilter` is not supported on Android RN
 * so we simulate frosted glass with layered translucent fills.
 */
export function GlassCard({
  children,
  style,
  glow = false,
  subdued = false,
  ...rest
}: GlassCardProps) {
  const { palette, radius } = theme;
  return (
    <View
      {...rest}
      style={[
        base.card,
        {
          backgroundColor: subdued
            ? 'rgba(21,28,56,0.32)'
            : palette.navy.overlay,
          borderColor: glow
            ? palette.neon.primary
            : palette.neon.faint,
        },
        glow && { elevation: 10, shadowOpacity: 0.5 },
        radius && { borderRadius: radius.lg },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const base = StyleSheet.create({
  card: {
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    padding: theme.spacing.md,
    shadowColor: '#000',
    shadowOpacity: 0.28,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
    overflow: 'hidden',
  },
});