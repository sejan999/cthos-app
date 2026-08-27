import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme';

interface ErrorBoundaryProps {
  children?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

/**
 * Global Error Boundary — catches any render/lifecycle exception anywhere in
 * the Cthos tree and shows a themed recovery screen instead of letting the OS
 * kill us into a white screen ("auto-back"). Class component by design:
 * componentDidCatch only exists there. Ships render-safe fallbacks that never
 * depend on navigation, storage, or voice engines.
 */
export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false, message: '' };

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    const message =
      error instanceof Error ? error.message : typeof error === 'object' && error !== null
        ? Object.prototype.toString.call(error)
        : String(error ?? 'Unknown error');
    return { hasError: true, message: message.slice(0, 300) };
  }

  componentDidCatch(error: unknown, info: unknown) {
    // Keep on-device breadcrumbs; no external reporting service required.
    console.error('[Cthos:Boundary]', error, info);
  }

  private recover = () => {
    this.setState({ hasError: false, message: '' });
  };

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.card}>
          <Ionicons name="warning" size={44} color={theme.palette.warning} />
          <Text style={styles.title}>Cthos hit a snag</Text>
          <Text style={styles.message} numberOfLines={4}>
            {this.state.message || 'An unexpected error occurred.'}
          </Text>
          <Text style={styles.hint}>
            Your data is safe. Tap below to reload the interface.
          </Text>
          <Pressable
            onPress={this.recover}
            accessibilityRole="button"
            accessibilityLabel="Reload Cthos"
            style={({ pressed }) => [styles.button, pressed && { opacity: 0.8 }]}
          >
            <Ionicons name="refresh" size={18} color="#0B101E" />
            <Text style={styles.buttonText}>Reload</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.palette.navy.base },
  card: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  title: { color: theme.palette.text.high, fontSize: 22, fontWeight: '800' },
  message: {
    color: theme.palette.text.mid,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
  },
  hint: { color: theme.palette.text.low, fontSize: 12, textAlign: 'center' },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: theme.palette.neon.primary,
  },
  buttonText: { color: '#0B101E', fontWeight: '700', fontSize: 15 },
});
