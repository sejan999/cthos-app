import React, { useEffect } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../theme';

/**
 * AvatarViewport — the central 3D AI-avatar viewport on the Dashboard.
 *
 * A glowing neon orb (gradient sphere with a faceted seam) enclosed by two
 * counter-rotating tracking rings, suggesting a living AI presence. STEP 3+ can
 * swap in a real 3D model / lottie asset while keeping this mount stable.
 */
export function AvatarViewport({
  size = 180,
  mood = 'Cthos',
}: {
  size?: number;
  mood?: string;
}) {
  const ringA = useSharedValue(0);
  const ringB = useSharedValue(0);
  const bob = useSharedValue(0);

  useEffect(() => {
    ringA.value = withRepeat(
      withTiming(360, { duration: 14000, easing: Easing.linear }),
      -1,
      false
    );
    ringB.value = withRepeat(
      withTiming(-360, { duration: 20000, easing: Easing.linear }),
      -1,
      false
    );
    bob.value = withRepeat(
      withTiming(1, { duration: 2600, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
  }, [bob, ringA, ringB]);

  const ringAStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${ringA.value}deg` }, { rotateX: '62deg' }],
  }));
  const ringBStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${ringB.value}deg` }, { rotateX: '-68deg' }],
  }));
  const orbStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: bob.value * 4 }],
  }));

  const core = size * 0.72;
  return (
    <View style={[styles.stage, { width: size, height: size }]}>
      {/* counter-rotating tracking rings */}
      <Animated.View
        style={[styles.ring, { width: size, height: size, borderRadius: size / 2 }, ringAStyle]}
      >
        <Svg width={size} height={size}>
          <Circle cx={size / 2} cy={size / 2} r={size / 2 - 6} stroke={theme.palette.neon.primary} strokeWidth={2} fill="none" strokeDasharray="14 22" strokeLinecap="round" />
        </Svg>
      </Animated.View>
      <Animated.View
        style={[styles.ring, StyleSheet.absoluteFill, ringBStyle]}
        pointerEvents="none"
      >
        <Svg width={size} height={size} style={{ transform: [{ rotateY: '8deg' }] }}>
          <Circle cx={size / 2} cy={size / 2} r={size / 2 - 14} stroke="rgba(111,163,240,0.5)" strokeWidth={1.5} fill="none" strokeDasharray="1 10" strokeLinecap="round" />
        </Svg>
      </Animated.View>

      {/* the orb */}
      <Animated.View style={[styles.orbWrap, orbStyle]}>
        <LinearGradient
          colors={['#1E2A56', theme.palette.navy.base]}
          start={{ x: 0.1, y: 0.1 }}
          end={{ x: 1, y: 1 }}
          style={[styles.orb, { width: core, height: core, borderRadius: core / 2 }]}
        >
          <View style={[styles.seam, { height: core * 0.95 }]} />
          <Text style={[styles.mood, { fontSize: core * 0.16 }]}>{mood}</Text>
        </LinearGradient>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  stage: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: { position: 'absolute', ...StyleSheet.absoluteFillObject } as any,
  orbWrap: { alignItems: 'center', justifyContent: 'center' },
  orb: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(74,144,226,0.5)',
    shadowColor: theme.palette.neon.primary,
    shadowOpacity: 0.5,
    shadowRadius: 22,
    elevation: 12,
  },
  seam: {
    position: 'absolute',
    width: 1,
    backgroundColor: 'rgba(111,163,240,0.4)',
  },
  mood: {
    color: theme.palette.text.mid,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
});