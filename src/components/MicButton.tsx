import React, { useRef } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useUserStore } from '../store/userState';
import { audioStreamer } from '../services/voice/audioStreamer';
import { forget } from '../utils/safeRun';
import { theme } from '../theme';
import { VoiceVisualizer } from './VoiceVisualizer';

/**
 * MicButton — the floating glowing-blue microphone. Toggles the voice engine
 * `micActive` store flag and starts/stops the AudioStreamer (STT + TTS loop).
 * Haptics give tactile acknowledgement; failures surface as a native Alert so
 * "tapped the mic and nothing happened" can never be silent.
 */
export function MicButton({ visible = true }: { visible?: boolean }) {
  const micActive = useUserStore((s) => s.micActive);
  const setMicActive = useUserStore((s) => s.setMicActive);
  const setVoiceReady = useUserStore((s) => s.setVoiceReady);
  const warnedNoStt = useRef(false);

  const toggle = async () => {
    forget('mic:haptics', Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
    if (!audioStreamer.sttAvailable()) {
      if (!warnedNoStt.current) {
        warnedNoStt.current = true;
        Alert.alert(
          'Voice unavailable',
          'Speech recognition is not active in this build. Use a development client build (EAS) for live voice — text chat works everywhere.',
        );
      }
      return;
    }
    const next = !micActive;
    try {
      if (next) {
        await audioStreamer.start();
        setMicActive(true);
        setVoiceReady(true);
        if (!audioStreamer.isActive()) {
          // Start call resolved but recognition never armed — usually a
          // denied mic permission on low-end OEM builds.
          setMicActive(false);
          setVoiceReady(false);
          Alert.alert(
            'Microphone blocked',
            'Cthos could not start listening. Check that microphone permission is granted in Android Settings.',
          );
        }
      } else {
        await audioStreamer.stop();
        setMicActive(false);
        setVoiceReady(false);
      }
    } catch (e) {
      console.warn('[Cthos:Mic]', e);
      setMicActive(false);
      setVoiceReady(false);
    }
  };


  if (!visible) return null;
  return (
    <View style={styles.floatWrap} pointerEvents="box-none">
      <VoiceVisualizer active={micActive} />
      <Pressable
        onPress={toggle}
        accessibilityRole="button"
        accessibilityState={{ checked: micActive }}
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