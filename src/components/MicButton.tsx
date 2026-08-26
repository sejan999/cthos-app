import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useUserStore } from '../store/userState';
import { audioStreamer } from '../services/voice/audioStreamer';
import { theme } from '../theme';
import { VoiceVisualizer } from './VoiceVisualizer';

/**
 * MicButton — the floating glowing-blue microphone. Toggles the voice engine
 * `micActive` store flag and starts/stops the AudioStreamer abstraction (real
 * STT/TTS glue arrives STEP 3). Haptics give tactile acknowledgement.
 */
export function MicButton({ visible = true }: { visible?: boolean }) {
  const micActive = useUserStore((s) => s.micActive);
  const setMicActive = useUserStore((s) => s.setMicActive);

  const toggle = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const next = !micActive;
    setMicActive(next);
    if (next) {
      await audioStreamer.start();
    } else {
      await audioStreamer.stop();
    }
  };

  if (!visible) return null;
  return (
    <View style={styles.floatWrap} pointerEvents="box-none">
      <VoiceVisualizer active={micActive} />
      <Pressable
        onPress={toggle}
        accessibilityRole="button"
        accessibilityLabel={micActive ? 'Stop listening' : 'Start listening'}
        style={({ pressed }) => [
          styles.btn,
          {
            backgroundColor: micActive
              ? theme.palette.neon.primary
              : 'rgba(74,144,226,0.22)',
            borderColor: micActive
              ? theme.palette.neon.soft
              : theme.palette.neon.faint,
          },
          pressed && { transform: [{ scale: 0.92 }] },
          micActive && styles.btnActive,
        ]}
      >
        <Ionicons
          name={micActive ? 'mic' : 'mic-outline'}
          size={30}
          color={micActive ? '#0B101E' : theme.palette.neon.primary}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  floatWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  btn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnActive: {
    shadowColor: theme.palette.neon.primary,
    shadowOpacity: 0.7,
    shadowRadius: 22,
    elevation: 12,
  },
});