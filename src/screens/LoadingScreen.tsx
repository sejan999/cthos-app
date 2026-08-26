import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { theme } from '../theme';

/**
 * STEP 1 placeholder — full opening screen (glowing heart, splash, spinner)
 * is built in STEP 2.
 */
export function LoadingScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Cthos</Text>
      <Text style={styles.caption}>Initializing…</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.palette.navy.base,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: theme.palette.neon.primary,
    fontSize: 44,
    fontWeight: '800',
    letterSpacing: 1,
  },
  caption: {
    marginTop: theme.spacing.md,
    color: theme.palette.text.low,
    fontSize: 14,
  },
});
