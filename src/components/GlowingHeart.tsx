import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { theme } from '../theme';

export const HEART_PATH =
  'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z';

/**
 * GlowingHeart — the brand mark of the Loading screen and Dashboard avatar.
 * A neon-blue SVG heart with a soft radial glow (blurred backing circle) and a
 * gentle pulse animation.
 */
export function GlowingHeart({
  size = 88,
  color = theme.palette.neon.primary,
}: {
  size?: number;
  color?: string;
}) {
  const pulse = useSharedValue(1);
  const glow = useSharedValue(0.55);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: 900, easing: Easing.inOut(Easing.sin) }),
        withTiming(1, { duration: 900, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );
    glow.value = withRepeat(
      withSequence(
        withTiming(0.85, { duration: 900, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.45, { duration: 900, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );
  }, [glow, pulse]);

  const heartStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));
  const haloStyle = useAnimatedStyle(() => ({
    opacity: glow.value,
  }));

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {/* soft glow halo */}
      <Animated.View
        style={[
          styles.halo,
          { width: size * 1.35, height: size * 1.35, borderRadius: (size * 1.35) / 2 },
          haloStyle,
        ]}
      />
      <Animated.View style={heartStyle}>
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path d={HEART_PATH} fill={color} fillOpacity={0.95} />
        </Svg>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  halo: {
    position: 'absolute',
    backgroundColor: theme.palette.neon.faint,
  },
});