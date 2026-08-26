import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { DashboardScreen } from '../screens/DashboardScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { VisionScreen } from '../screens/VisionScreen';
import { MacroScreen } from '../screens/MacroScreen';
import { LoadingScreen } from '../screens/LoadingScreen';
import { DrawerParamList, RootStackParamList } from './types';

const Drawer = createDrawerNavigator<DrawerParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

/**
 * Drawer navigator — HOME / PRODUCTIVITY / SYSTEM grouping will be layered
 * on top in STEP 2 via custom drawer content. For STEP 1 we register the four
 * primary destinations.
 */
function MainDrawerNavigator() {
  return (
    <Drawer.Navigator
      screenOptions={{
        headerShown: false,
        drawerType: 'front',
        drawerActiveBackgroundColor: '#1E2747',
        drawerActiveTintColor: '#4A90E2',
        drawerInactiveTintColor: 'rgba(244,247,255,0.6)',
        drawerStyle: {
          backgroundColor: 'rgba(11,16,30,0.96)',
          width: 300,
        },
      }}
    >
      <Drawer.Screen name="Dashboard" component={DashboardScreen} />
      <Drawer.Screen name="Settings" component={SettingsScreen} />
      <Drawer.Screen name="Vision" component={VisionScreen} />
      <Drawer.Screen name="Macro" component={MacroScreen} />
    </Drawer.Navigator>
  );
}

export function RootNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#0B101E' },
      }}
    >
      <Stack.Screen name="Loading" component={LoadingScreen} />
      <Stack.Screen name="Main" component={MainDrawerNavigator} />
    </Stack.Navigator>
  );
}
