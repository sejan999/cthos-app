import React, { useCallback, useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GlassCard } from './GlassCard';
import { theme } from '../theme';
import { apiKeyStore } from '../services/ai/aiKeyStore';

type KeySource = 'secure' | 'env' | 'missing';

/**
 * GeminiKeyCard — Settings entry point for the Gemini Live API key.
 *
 * The key is validated (must start with the "AQ" prefix) and persisted
 * encrypted via expo-secure-store. Shows the current source (stored / env)
 * plus Save / Clear actions so the voice engine can go live.
 */
export function GeminiKeyCard() {
  const [value, setValue] = useState('');
  const [source, setSource] = useState<KeySource>('missing');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const src = await apiKeyStore.source();
    setSource(src);
    const stored = await apiKeyStore.get();
    if (src === 'secure' && stored) {
      setMessage(`Using a key starting with ${apiKeyStore.prefix}… (stored)`);
    } else if (src === 'env') {
      setMessage(`Using the ${apiKeyStore.prefix}… key from the environment.`);
    } else {
      setMessage('No key yet — add one to enable live replies.');
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const save = useCallback(async () => {
    setBusy(true);
    setMessage(null);
    try {
      await apiKeyStore.save(value);
      setValue('');
      await refresh();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Could not save that key.');
    } finally {
      setBusy(false);
    }
  }, [value, refresh]);

  const clear = useCallback(async () => {
    setBusy(true);
    setMessage(null);
    try {
      await apiKeyStore.delete();
      setValue('');
      setSource('missing');
      setMessage('Key removed.');
    } finally {
      setBusy(false);
    }
  }, []);

  const hasActive = source !== 'missing';

  return (
    <GlassCard style={styles.card}>
      <View style={styles.header}>
        <View style={styles.iconWrap}>
          <Ionicons name="key" size={18} color={theme.palette.neon.primary} />
        </View>
        <View style={styles.headMid}>
          <Text style={styles.title}>Gemini API Key</Text>
          <Text style={styles.subtitle}>Powers live, persona-aware replies</Text>
        </View>
        <View style={[styles.badge, hasActive ? styles.badgeOn : styles.badgeOff]}>
          <Text style={[styles.badgeText, hasActive && { color: 'rgba(61,220,151,1)' }]}>
            {hasActive ? 'ON' : 'OFF'}
          </Text>
        </View>
      </View>

      <TextInput
        style={styles.input}
        value={value}
        onChangeText={setValue}
        placeholder="Paste your AQ… Gemini API key"
        placeholderTextColor={theme.palette.text.low}
        autoCapitalize="none"
        autoCorrect={false}
        secureTextEntry
        editable={!busy}
      />

      <View style={styles.actions}>
        <Pressable
          onPress={save}
          disabled={busy || !value.trim()}
          style={({ pressed }) => [
            styles.btn,
            styles.btnPrimary,
            (busy || !value.trim()) && styles.btnDisabled,
            pressed && { opacity: 0.85 },
          ]}
        >
          {busy ? (
            <ActivityIndicator color="#0B101E" size="small" />
          ) : (
            <Text style={styles.btnPrimaryText}>Save key</Text>
          )}
        </Pressable>

        {hasActive ? (
          <Pressable
            onPress={clear}
            disabled={busy}
            style={({ pressed }) => [styles.btn, styles.btnGhost, pressed && { opacity: 0.7 }]}
          >
            <Text style={styles.btnGhostText}>Clear</Text>
          </Pressable>
        ) : null}
      </View>

      {message ? <Text style={styles.message}>{message}</Text> : null}
    </GlassCard>
  );
}


const styles = StyleSheet.create({
  card: { marginBottom: theme.spacing.lg, padding: theme.spacing.md },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(74,144,226,0.12)',
    marginRight: theme.spacing.sm,
  },
  headMid: { flex: 1 },
  title: { color: theme.palette.text.high, fontSize: 15, fontWeight: '600' },
  subtitle: { color: theme.palette.text.mid, fontSize: 12, marginTop: 2 },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
  },
  badgeOn: { borderColor: 'rgba(61,220,151,0.5)', backgroundColor: 'rgba(61,220,151,0.08)' },
  badgeOff: { borderColor: theme.palette.navy.stroke, backgroundColor: 'rgba(11,16,30,0.4)' },
  badgeText: { fontSize: 10, fontWeight: '800', color: theme.palette.text.low, letterSpacing: 1 },
  input: {
    backgroundColor: 'rgba(11,16,30,0.6)',
    borderWidth: 1,
    borderColor: theme.palette.navy.stroke,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    color: theme.palette.text.high,
    fontSize: 14,
    marginTop: theme.spacing.xs,
  },
  actions: { flexDirection: 'row', gap: theme.spacing.sm, marginTop: theme.spacing.sm },
  btn: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radius.md,
  },
  btnPrimary: { backgroundColor: theme.palette.neon.primary },
  btnGhost: {
    flexGrow: 0,
    paddingHorizontal: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.palette.neon.faint,
  },
  btnDisabled: { opacity: 0.45 },
  btnPrimaryText: { color: '#0B101E', fontSize: 14, fontWeight: '700' },
  btnGhostText: { color: theme.palette.text.mid, fontSize: 14, fontWeight: '600' },
  message: { marginTop: theme.spacing.sm, color: theme.palette.text.mid, fontSize: 12 },
});
