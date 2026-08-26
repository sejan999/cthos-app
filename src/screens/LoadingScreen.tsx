import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { GlowingHeart } from '../components/GlowingHeart';
import { CthosLogo } from '../components/CthosLogo';
import { RootStackParamList } from '../navigation/types';
import { theme } from '../theme';

const BOOT_DELAY_MS = 2600;

/**
 * Screen 1 — App Opening Screen.
 * Dark-navy gradient, glowing blue heart mark, bold 'Cthos' typography and a
 * minimal neon spinner. After a short boot animation the app advances to the
 * Main dashboard.
 */
export function LoadingScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  useEffect(() => {
    const t = setTimeout(() => {
      navigation.replace('Main', { screen: 'Dashboard' });
    }, BOOT_DELAY_MS);
    return () => clearTimeout(t);
  }, [navigation]);

  return (
    <LinearGradient
      colors={['#0B101E', '#0E1530']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <Animated.View entering={FadeInUp.duration(900)} style={styles.mark}>
        <GlowingHeart size={104} />
      </Animated.View>
      <CthosLogo size="hero" />
      <View style={styles.spinnerRow}>
        <ActivityIndicator size="small" color={theme.palette.neon.primary} />
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mark: { marginBottom: theme.spacing.xl },
  spinnerRow: { marginTop: theme.spacing.xxl },
});
