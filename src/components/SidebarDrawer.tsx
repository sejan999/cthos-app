import React from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { DrawerContentComponentProps } from '@react-navigation/drawer';
import type { DrawerParamList } from '../navigation/types';
import { theme } from '../theme';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

interface DrawerItem {
  name: keyof DrawerParamList;
  label: string;
  icon: IoniconName;
  activeIcon: IoniconName;
}

interface Section {
  title: string;
  items: DrawerItem[];
}

const SECTIONS: Section[] = [
  {
    title: 'Home',
    items: [{ name: 'Dashboard', label: 'Home', icon: 'home-outline', activeIcon: 'home' }],
  },
  {
    title: 'Productivity',
    items: [
      { name: 'Vision', label: 'Vision', icon: 'scan-outline', activeIcon: 'scan' },
      { name: 'Macro', label: 'Macro Studio', icon: 'options-outline', activeIcon: 'options' },
    ],
  },
  {
    title: 'System',
    items: [
      { name: 'Settings', label: 'Settings', icon: 'settings-outline', activeIcon: 'settings' },
    ],
  },
];

/**
 * SidebarDrawer — the 3-Dot drawer content grouped into HOME / PRODUCTIVITY /
 * SYSTEM with glass sections and a neon active-state rail.
 */
export function SidebarDrawer(props: DrawerContentComponentProps) {
  const { state, navigation } = props;
  const activeKey = state.routes[state.index]?.key ?? '';

  const go = (name: keyof DrawerParamList) => {
    navigation.navigate(name);
  };

  return (
    <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={styles.safe}>
      {/* brand header */}
      <View style={styles.brand}>
        <View style={styles.brandIcon}>
          <Ionicons name="pulse" size={22} color={theme.palette.neon.primary} />
        </View>
        <View>
          <Text style={styles.brandTitle}>Cthos</Text>
          <Text style={styles.brandSub}>always listening</Text>
        </View>
      </View>

      <View style={styles.sections}>
        {SECTIONS.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.itemGroup}>
              {section.items.map((item) => {
                const isActive = state.routes.some(
                  (r) => r.key === activeKey && r.name === item.name
                );
                return (
                  <Pressable
                    key={item.name}
                    onPress={() => go(item.name)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isActive }}
                    style={({ pressed }) => [
                      styles.item,
                      isActive && styles.itemActive,
                      pressed && { transform: [{ scale: 0.98 }] },
                    ]}
                  >
                    {/* active indicator rail */}
                    <View style={[styles.rail, isActive && styles.railActive]} />
                    <Ionicons
                      name={isActive ? item.activeIcon : item.icon}
                      size={20}
                      color={isActive ? theme.palette.neon.primary : theme.palette.text.mid}
                    />
                    <Text style={[styles.itemLabel, isActive && styles.itemLabelActive]}>
                      {item.label}
                    </Text>
                    {isActive ? <View style={styles.dot} /> : null}
                  </Pressable>
                );
              })}
            </View>
          </View>
        ))}
      </View>

      {/* footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Cthos v0.1.0</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: 'rgba(11,16,30,0.97)',
    paddingHorizontal: theme.spacing.md,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(111,163,240,0.12)',
    marginBottom: theme.spacing.md,
  },
  brandIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(74,144,226,0.16)',
    borderWidth: 1,
    borderColor: theme.palette.neon.faint,
  },
  brandTitle: {
    color: theme.palette.text.high,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 1,
  },
  brandSub: {
    color: theme.palette.text.low,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  sections: { flex: 1 },
  section: { marginBottom: theme.spacing.lg },
  sectionTitle: {
    color: theme.palette.text.low,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.4,
    marginBottom: theme.spacing.xs,
    paddingLeft: 6,
  },
  itemGroup: {
    borderRadius: theme.radius.lg,
    backgroundColor: 'rgba(21,28,56,0.5)',
    borderWidth: 1,
    borderColor: theme.palette.neon.faint,
    overflow: 'hidden',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 13,
    paddingHorizontal: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(111,163,255,0.08)',
  },
  itemActive: { backgroundColor: 'rgba(74,144,226,0.12)' },
  rail: {
    width: 3,
    height: 20,
    borderRadius: 3,
    backgroundColor: 'transparent',
  },
  railActive: { backgroundColor: theme.palette.neon.primary },
  itemLabel: {
    flex: 1,
    color: theme.palette.text.mid,
    fontSize: 15,
    fontWeight: '600',
  },
  itemLabelActive: { color: theme.palette.text.high },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.palette.neon.primary,
  },
  footer: { paddingVertical: theme.spacing.lg, alignItems: 'center' },
  footerText: { color: theme.palette.text.low, fontSize: 12 },
});