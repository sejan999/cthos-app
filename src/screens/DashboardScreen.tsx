import React, { useMemo, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  ScrollView,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { DrawerNavigationProp } from '@react-navigation/drawer';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { GlassCard } from '../components/GlassCard';
import { CthosLogo } from '../components/CthosLogo';
import { AvatarViewport } from '../components/AvatarViewport';
import { PillButton } from '../components/PillButton';
import { DataWidget } from '../components/DataWidget';
import { MicButton } from '../components/MicButton';
import { useUserStore } from '../store/userState';
import {
  useConversationStore,
  submitText,
} from '../store/conversationState';
import { DrawerParamList } from '../navigation/types';
import { theme } from '../theme';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const QUICK_ACTIONS: { label: string; icon: IoniconName }[] = [
  { label: 'Music', icon: 'musical-notes-outline' },
  { label: 'Study', icon: 'book-outline' },
  { label: 'Journal', icon: 'create-outline' },
];

/**
 * Screen 2 — Main Dashboard.
 * Glass header card, central 3D avatar viewport, quick-action pills, weather /
 * date / mood data widgets, the conversational input bar and the floating mic
 * with live voice visualizer.
 */
export function DashboardScreen() {
  const navigation = useNavigation<DrawerNavigationProp<DrawerParamList>>();
  const persona = useUserStore((s) => s.persona);
  const micActive = useUserStore((s) => s.micActive);
  const engineState = useConversationStore((s) => s.engineState);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);

  async function sendDraft() {
    const text = draft.trim();
    if (!text || sending) return;
    setSending(true);
    setDraft('');
    try {
      await submitText(text);
    } finally {
      setSending(false);
    }
  }

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  const today = useMemo(
    () =>
      new Date().toLocaleDateString(undefined, {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
      }),
    []
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <LinearGradient
        colors={['#0B101E', '#0E1530', '#0B101E']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.bg}
      >
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Pressable
              onPress={() => navigation.openDrawer()}
              accessibilityLabel="Open menu"
              style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.7 }]}
            >
              <Ionicons name="menu" size={22} color={theme.palette.text.high} />
            </Pressable>
            <View style={styles.headerCenter}>
              <CthosLogo size="compact" />
              <View style={styles.onlineRow}>
                <View
                  style={[
                    styles.onlineDot,
                    (micActive || engineState === 'speaking') && {
                      backgroundColor: theme.palette.warning,
                    },
                  ]}
                />
                <Text style={styles.onlineText}>
                  {engineState === 'speaking'
                    ? 'speaking'
                    : engineState === 'thinking'
                      ? 'thinking…'
                      : micActive || engineState === 'listening'
                        ? 'listening'
                        : 'voice ready'}
                </Text>
              </View>
            </View>
            <Pressable
              accessibilityLabel="Profile"
              style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.7 }]}
            >
              <Ionicons name="person" size={20} color={theme.palette.neon.primary} />
            </Pressable>
          </View>

          <GlassCard glow style={styles.heroCard}>
            <Text style={styles.heroGreeting}>{greeting}</Text>
            <Text style={styles.heroTitle}>
              {persona === 'GF' ? 'Hey love' : persona === 'Venom' ? 'Let’s go' : 'At your service'}
            </Text>
            <Text style={styles.heroSub}>Tap the mic and talk — I’ll handle the rest.</Text>
          </GlassCard>

          <View style={styles.avatarWrap}>
            <AvatarViewport size={288} mood="Cthos" />
          </View>

          <View style={styles.actionsRow}>
            {QUICK_ACTIONS.map((a) => (
              <PillButton key={a.label} label={a.label} icon={a.icon} style={styles.pillFlex} />
            ))}
          </View>

          <View style={styles.widgetsRow}>
            <DataWidget icon="partly-sunny-outline" label="Weather" value="26°" sub="Sunny · New Delhi" />
            <DataWidget icon="calendar-outline" label="Date" value={today} sub="Today" />
            <DataWidget
              icon="happy-outline"
              label="Mood"
              value="Focused"
              sub="Tap to log"
              accent={theme.palette.warning}
            />
          </View>
        </ScrollView>

        <View style={styles.dock} pointerEvents="box-none">
          <GlassCard glow style={styles.inputCard}>
            <TextInput
              value={draft}
              onChangeText={setDraft}
              placeholder="Message Cthos…"
              placeholderTextColor={theme.palette.text.low}
              style={styles.input}
              returnKeyType="send"
              onSubmitEditing={sendDraft}
            />
            <Pressable
              onPress={sendDraft}
              disabled={!draft.trim() || sending}
              accessibilityLabel="Send"
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.sendBtn,
                { opacity: draft.trim() && !sending ? 1 : 0.4 },
                pressed && { transform: [{ scale: 0.92 }] },
              ]}
            >
              <Ionicons name="arrow-up" size={18} color="#0B101E" />
            </Pressable>
          </GlassCard>
          <MicButton visible />
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.palette.navy.base, overflow: 'hidden' },
  bg: { flex: 1 },
  scroll: { paddingBottom: 210 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xs,
    paddingBottom: theme.spacing.sm,
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
  headerCenter: { alignItems: 'center' },
  onlineRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xxs, marginTop: 2 },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.palette.success,
    shadowColor: theme.palette.success,
    shadowOpacity: 0.9,
    shadowRadius: 5,
  },
  onlineText: {
    color: theme.palette.text.low,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  heroCard: { marginHorizontal: theme.spacing.lg, marginTop: theme.spacing.sm, padding: theme.spacing.lg },
  heroGreeting: { color: theme.palette.text.low, fontSize: 13 },
  heroTitle: { color: theme.palette.neon.primary, fontSize: 24, fontWeight: '800', marginTop: 4 },
  heroSub: { color: theme.palette.text.mid, fontSize: 13, marginTop: 6, lineHeight: 18 },
  avatarWrap: { alignItems: 'center', marginVertical: theme.spacing.sm },
  actionsRow: { flexDirection: 'row', paddingHorizontal: theme.spacing.lg, gap: theme.spacing.md },
  pillFlex: { flex: 1 },
  widgetsRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.md,
  },
  dock: {
    position: 'absolute',
    left: theme.spacing.lg,
    right: theme.spacing.lg,
    bottom: theme.spacing.md,
    gap: theme.spacing.md,
    alignItems: 'center',
  },
  inputCard: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingVertical: 6,
    paddingLeft: theme.spacing.md,
    paddingRight: 6,
  },
  input: { flex: 1, color: theme.palette.text.high, fontSize: 15, paddingVertical: 8 },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.palette.neon.primary,
  },
});