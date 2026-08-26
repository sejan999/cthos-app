import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { DashboardScreen } from '../screens/DashboardScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { VisionScreen } from '../screens/VisionScreen';
import { MacroScreen } from '../screens/MacroScreen';
import { LoadingScreen } from '../screens/LoadingScreen';
import { SidebarDrawer } from '../components/SidebarDrawer';
import { DrawerParamList, RootStackParamList } from './types';

const Drawer = createDrawerNavigator<DrawerParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

/**
 * Drawer navigator — custom three-section SidebarDrawer (HOME / PRODUCTIVITY /
 * SYSTEM) with the navy scrim. Registers the four primary destinations.
 */
function MainDrawerNavigator() {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <SidebarDrawer {...props} />}
      screenOptions={{
        headerShown: false,
        drawerType: 'front',
        drawerStyle: {
          backgroundColor: 'transparent',
          width: 320,
        },
        overlayColor: 'rgba(2,5,12,0.55)',
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
