import React from 'react';
import { StyleSheet, Text, View, TextStyle } from 'react-native';
import { theme } from '../theme';

/**
 * CthosLogo — bold "Cthos" wordmark with a medium neon-blue glow. Used on the
 * Loading screen (hero) and the Dashboard status bar (compact).
 */
export function CthosLogo({
  size = 'hero',
  color = theme.palette.neon.primary,
}: {
  size?: 'hero' | 'compact';
  color?: string;
}) {
  const hero = size === 'hero';
  return (
    <View style={styles.wrap}>
      <Text
        style={[
          styles.text,
          hero ? styles.hero : styles.compact,
          { color, textShadowColor: addAlpha(color, 0.55) },
        ]}
        allowFontScaling={false}
      >
        Cthos
      </Text>
    </View>
  );
}

/** Append alpha to a hex color for text glow. */
function addAlpha(hex: string, alpha: number): string {
  const clean = hex.replace('#', '');
  const a = Math.round(alpha * 255)
    .toString(16)
    .padStart(2, '0');
  return `#${clean}${a}`;
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center' },
  text: {
    fontWeight: '800',
    letterSpacing: 1.5,
    textShadowRadius: 18,
    textShadowOffset: { width: 0, height: 0 },
  } as TextStyle,
  hero: { fontSize: 52, lineHeight: 60 },
  compact: { fontSize: 22, lineHeight: 28 },
});