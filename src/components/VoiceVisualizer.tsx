import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { theme } from '../theme';

const BAR_COUNT = 9;

/**
 * VoiceVisualizer — real-time waveform feedback behind the mic. Each bar
 * animates between idle and speaking amplitudes; the strip settles to a flat
 * line when inactive. When `active` flips, bars restart their pulse loop.
 */
export function VoiceVisualizer({ active = false }: { active?: boolean }) {
  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        {Array.from({ length: BAR_COUNT }).map((_, i) => (
          <Bar key={i} index={i} active={active} />
        ))}
      </View>
    </View>
  );
}

function Bar({ index, active }: { index: number; active: boolean }) {
  const height = useSharedValue(active ? 1 : 0.12);
  const stripOpacity = useSharedValue(active ? 1 : 0.25);

  useEffect(() => {
    stripOpacity.value = withTiming(active ? 1 : 0.25, { duration: 260 });
    if (active) {
      height.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 300 + index * 18, easing: Easing.inOut(Easing.sin) }),
          withTiming(0.35, { duration: 300 + index * 18, easing: Easing.inOut(Easing.sin) })
        ),
        -1,
        true
      );
    } else {
      height.value = withTiming(0.12, { duration: 220 });
    }
    // re-run when active flips; shared values are stable refs
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  const barStyle = useAnimatedStyle(() => ({
    height: 8 + height.value * 36,
    opacity: stripOpacity.value,
  }));

  return <Animated.View style={[styles.bar, barStyle]} />;
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 46,
  },
  bar: {
    width: 4,
    borderRadius: 4,
    backgroundColor: theme.palette.neon.primary,
  },
});