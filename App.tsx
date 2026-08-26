import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { RootNavigator } from './src/navigation/RootNavigator';

/**
 * Themed navigation container — forces the dark-navy palette so React
 * Navigation Chrome (back button, drawer, headers) matches Cthos's design.
 */
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
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <NavigationContainer theme={cthosNavigationTheme}>
          <StatusBar style="light" backgroundColor="#0B101E" translucent />
          <RootNavigator />
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}