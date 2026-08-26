import type { NavigatorScreenParams } from '@react-navigation/native';

/**
 * Central navigation type registry for Cthos.
 *
 * Keeps param lists for every stack & drawer screen in one typed place so the
 * rest of the app (and future STEP 5 wiring) can navigate with full
 * type-safety.
 */

// Main drawer destinations
export type DashboardTab = 'Dashboard' | 'Settings' | 'Vision' | 'Macro';

export type DrawerParamList = {
  Dashboard: undefined;
  Settings: undefined;
  Vision: undefined;
  Macro: undefined;
};

export type RootStackParamList = {
  Loading: undefined;
  Main: NavigatorScreenParams<DrawerParamList>;
};

// Global type augmentation so useNavigation() infers params everywhere.
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
