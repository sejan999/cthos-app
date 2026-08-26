import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useUserStore } from '../store/userState';
import { audioStreamer } from '../services/voice/audioStreamer';
import { PERSONAS } from '../services/ai/personalityManager';
import { PersonaId } from '../services/types';
import { theme } from '../theme';

const ORDER: PersonaId[] = ['GF', 'Professional', 'Venom'];

/**
 * PersonaSwitcher — segmented control for the three Cthos personas. Switching
 * updates the shared store AND the live voice session so TTS timbre follows.
 */
export function PersonaSwitcher() {
  const persona = useUserStore((s) => s.persona);
  const setPersona = useUserStore((s) => s.setPersona);

  const select = (p: PersonaId) => {
    setPersona(p);
    audioStreamer.setPersona(p);
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.segment}>
        {ORDER.map((p) => {
          const active = persona === p;
          return (
            <Pressable
              key={p}
              onPress={() => select(p)}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              style={({ pressed }) => [
                styles.option,
                active && styles.optionActive,
                pressed && { opacity: 0.8 },
              ]}
            >
              <Text style={[styles.label, active && styles.labelActive]}>
                {PERSONAS[p].label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <Text style={styles.hint}>{PERSONAS[persona].systemPrompt}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: theme.spacing.sm, marginTop: theme.spacing.xs },
  segment: {
    flexDirection: 'row',
    backgroundColor: 'rgba(74,144,226,0.10)',
    borderRadius: theme.radius.md,
    padding: 3,
    borderWidth: 1,
    borderColor: theme.palette.neon.faint,
  },
  option: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: theme.radius.sm,
    alignItems: 'center',
  },
  optionActive: { backgroundColor: theme.palette.neon.primary },
  label: {
    color: theme.palette.text.mid,
    fontSize: 12,
    fontWeight: '700',
  },
  labelActive: { color: '#0B101E' },
  hint: { color: theme.palette.text.low, fontSize: 11, lineHeight: 16 },
});