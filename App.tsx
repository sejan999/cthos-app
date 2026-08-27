import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { RootNavigator } from './src/navigation/RootNavigator';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import {
  installGlobalErrorTrap,
  forget,
} from './src/utils/safeRun';
import { initVoice } from './src/store/conversationState';
import { hydratePersona } from './src/store/userState';

/**
 * Boot sequence (STEP 5 hardening):
 *   - The global JS error trap is installed FIRST so nothing below can crash
 *     invisibly on either Hermes or JSC.
 *   - Async initialisation runs as supervised fire-and-forget tasks: a failed
 *     voice binding or storage read logs a warning and the UI still mounts.
 *   - <ErrorBoundary> catches any render/lifecycle exception in the whole
 *     tree and offers an in-app reload instead of a white-screen/"auto-back".
 */
installGlobalErrorTrap();

forget('boot:initVoice', () => initVoice());
forget('boot:hydratePersona', () => hydratePersona());

/** Themed navigation container — forces the dark-navy palette so React
 * Navigation chrome (back button, drawer, headers) matches Cthos's design. */
const cthosNavigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#4A90E2',
    background: '#0B101E',
    card: '#111730',
    text: '#F4F7FF',
    border: '#1E2747',
    notification: '#4A90E2',
  },
};

export default function App() {
  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <NavigationContainer theme={cthosNavigationTheme}>
            <StatusBar style="light" backgroundColor="#0B101E" translucent />
            <RootNavigator />
          </NavigationContainer>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}
