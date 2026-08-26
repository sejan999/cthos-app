import React from 'react';
import { ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { DrawerNavigationProp } from '@react-navigation/drawer';
import { Ionicons } from '@expo/vector-icons';
import { GlassCard } from '../components/GlassCard';
import { SettingsRow } from '../components/SettingsRow';
import { DrawerParamList } from '../navigation/types';
import { theme } from '../theme';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

interface Row {
  icon: IoniconName;
  label: string;
  hint?: string;
}

interface Section {
  title: string;
  rows: Row[];
}

const SECTIONS: Section[] = [
  {
    title: 'Assistant',
    rows: [
      { icon: 'person-circle-outline', label: 'Cthos Persona', hint: 'GF · Professional · Venom' },
      { icon: 'sparkles-outline', label: 'Skills', hint: 'Voice, calls, WhatsApp, music, vision' },
      { icon: 'git-branch-outline', label: 'Sub-agents', hint: 'Mini-Cthos background workers' },
    ],
  },
  {
    title: 'Work & Messages',
    rows: [
      { icon: 'mail-outline', label: 'Email', hint: 'Read, draft & summarize' },
      { icon: 'logo-whatsapp', label: 'WhatsApp', hint: 'Send, read, calls, business' },
      { icon: 'share-social-outline', label: 'Social', hint: 'Post & reply shortcuts' },
    ],
  },
  {
    title: 'Connected Accounts',
    rows: [
      { icon: 'musical-notes-outline', label: 'Spotify', hint: 'Music engine + preferences' },
      { icon: 'logo-youtube', label: 'YouTube', hint: 'Playlists & streaming' },
      { icon: 'cloud-outline', label: 'Cloud & API keys', hint: 'STT / LLM providers' },
    ],
  },
  {
    title: 'Memory & Data',
    rows: [
      { icon: 'archive-outline', label: 'Preference Memory', hint: 'Learned tastes & routines' },
      { icon: 'shield-checkmark-outline', label: 'Privacy & Erase', hint: 'Audit and wipe data' },
    ],
  },
  {
    title: 'System',
    rows: [
      { icon: 'finger-print-outline', label: 'Permissions', hint: 'Mic, accessibility, overlay' },
      { icon: 'options-outline', label: 'Automation', hint: 'Accessibility bridge & toggles' },
      { icon: 'notifications-outline', label: 'Notifications', hint: 'Caller ID & announce' },
      { icon: 'information-circle-outline', label: 'About Cthos', hint: 'Version 0.1.0' },
    ],
  },
];

/**
 * Screen 4 — Settings.
 * Category-driven glass sections: ASSISTANT, WORK & MESSAGES, CONNECTED
 * ACCOUNTS, MEMORY & DATA, and SYSTEM.
 */
export function SettingsScreen() {
  const navigation = useNavigation<DrawerNavigationProp<DrawerParamList>>();

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Pressable
          onPress={() => navigation.openDrawer()}
          accessibilityLabel="Open menu"
          style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.7 }]}
        >
          <Ionicons name="menu" size={22} color={theme.palette.text.high} />
        </Pressable>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.iconBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {SECTIONS.map((section) => (
          <View key={section.title} style={styles.group}>
            <Text style={styles.groupTitle}>{section.title}</Text>
            <GlassCard style={styles.card}>
              {section.rows.map((row, i) => (
                <SettingsRow
                  key={row.label}
                  icon={row.icon}
                  label={row.label}
                  hint={row.hint}
                  last={i === section.rows.length - 1}
                />
              ))}
            </GlassCard>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.palette.navy.base },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(21,28,56,0.6)',
    borderWidth: 1,
    borderColor: theme.palette.neon.faint,
  },
  headerTitle: { color: theme.palette.text.high, fontSize: 20, fontWeight: '700' },
  scroll: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
  },
  group: { marginBottom: theme.spacing.lg },
  groupTitle: {
    color: theme.palette.text.low,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.4,
    marginBottom: theme.spacing.xs,
    paddingLeft: 6,
  },
  card: { paddingVertical: 2, paddingHorizontal: theme.spacing.md },
});