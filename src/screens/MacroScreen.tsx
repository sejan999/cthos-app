import React, { useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme';
import { GlassCard } from '../components/GlassCard';
import { accessibilityBridge } from '../services/automation/accessibilityBridge';
import { AutomateStep } from '../services/automation/accessibilityBridge.types';
import {
  MacroRoutine,
  macroRecorder,
  useMacroStore,
} from '../services/automation/macroRecorder';

/**
 * Macro Studio (STEP 4) — record multi-step device routines and trigger them
 * by voice or manually. Steps execute through the sub-agent queue; once the
 * CthosAccessibility native module ships (EAS dev client), gesture and
 * system-toggle steps run for real. Deep-link app openings already work.
 */

const QUICK_STEPS: { label: string; icon: string; step: AutomateStep }[] = [
  { label: 'Open WhatsApp', icon: 'chatbubble-ellipses', step: { op: 'openApp', app: 'whatsapp' } },
  { label: 'Open YouTube', icon: 'videocam', step: { op: 'openApp', app: 'youtube' } },
  { label: 'Open Spotify', icon: 'musical-notes', step: { op: 'openApp', app: 'spotify' } },
  { label: 'Scroll down', icon: 'arrow-down', step: { op: 'scroll', dir: 'down' } },
  { label: 'Scroll up', icon: 'arrow-up', step: { op: 'scroll', dir: 'up' } },
];

export function MacroScreen() {
  const routines = useMacroStore((s) => s.routines);
  const isRecording = useMacroStore((s) => s.isRecording);
  const recordingSteps = useMacroStore((s) => s.recordingSteps);
  const [nameDraft, setNameDraft] = useState('');

  function toggleRecording() {
    if (isRecording) setNameDraft('');
    macroRecorder.setRecording(!isRecording);
  }

  function addQuickStep(step: AutomateStep) {
    if (!isRecording) macroRecorder.setRecording(true);
    macroRecorder.pushRecordedStep(step);
  }

  function saveSession() {
    if (!nameDraft.trim()) return;
    macroRecorder.saveFromSession(nameDraft.trim());
    setNameDraft('');
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <FlatList
        data={routines}
        keyExtractor={(r) => r.id}
        contentContainerStyle={styles.scroll}
        ItemSeparatorComponent={() => <View style={{ height: theme.spacing.sm }} />}
        renderItem={({ item }) => <RoutineRow routine={item} />}
        ListHeaderComponent={
          <>
            <Text style={styles.heading}>Macro Studio</Text>
            <Text style={styles.caption}>
              Record device steps, then trigger them by voice.
            </Text>

            <GlassCard glow={isRecording}>
              <View style={styles.recHead}>
                <Ionicons
                  name={isRecording ? 'radio' : 'mic-outline'}
                  size={18}
                  color={
                    isRecording
                      ? theme.palette.danger
                      : theme.palette.neon.primary
                  }
                />
                <Text style={styles.recTitle}>
                  {isRecording
                    ? `Recording — ${recordingSteps.length} step(s)`
                    : 'Recorder idle'}
                </Text>
              </View>

              <View style={styles.quickWrap}>
                {QUICK_STEPS.map((q) => (
                  <Pressable
                    key={q.label}
                    accessibilityRole="button"
                    accessibilityLabel={`Add step ${q.label}`}
                    style={({ pressed }) => [
                      styles.chip,
                      pressed && styles.chipPressed,
                    ]}
                    onPress={() => addQuickStep(q.step)}
                  >
                    <Ionicons
                      name={q.icon as never}
                      size={14}
                      color={theme.palette.text.high}
                    />
                    <Text style={styles.chipText}>{q.label}</Text>
                  </Pressable>
                ))}
              </View>

              <TextInput
                value={nameDraft}
                onChangeText={setNameDraft}
                placeholder="Routine name (voice trigger)"
                placeholderTextColor={theme.palette.text.low}
                style={styles.input}
              />

              <View style={styles.btnRow}>
                <Pressable
                  accessibilityRole="button"
                  onPress={toggleRecording}
                  style={[styles.btn, isRecording ? styles.btnStop : styles.btnStart]}
                >
                  <Ionicons name={isRecording ? 'stop' : 'play'} size={16} color="#fff" />
                  <Text style={styles.btnText}>{isRecording ? 'Stop' : 'Record'}</Text>
                </Pressable>

                <Pressable
                  accessibilityRole="button"
                  disabled={!recordingSteps.length || !nameDraft.trim()}
                  onPress={saveSession}
                  style={[
                    styles.btn,
                    styles.btnSave,
                    (!recordingSteps.length || !nameDraft.trim()) && styles.btnDisabled,
                  ]}
                >
                  <Ionicons name="save" size={16} color="#fff" />
                  <Text style={styles.btnText}>Save</Text>
                </Pressable>

                {isRecording ? (
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => macroRecorder.discardSession()}
                    style={[styles.btn, styles.btnGhost]}
                  >
                    <Text style={styles.btnGhostText}>Discard</Text>
                  </Pressable>
                ) : null}
              </View>
            </GlassCard>

            {!accessibilityBridge.nativeAvailable ? (
              <Text style={styles.note}>
                Gestures &amp; system toggles need the CthosAccessibility native
                module (EAS dev client). Deep-link steps work today.
              </Text>
            ) : null}

            <Text style={styles.sectionTitle}>Routines</Text>
          </>
        }
        ListEmptyComponent={
          <GlassCard subdued>
            <Text style={styles.emptyText}>
              No routines yet. Record one above, then say its name to Cthos.
            </Text>
          </GlassCard>
        }
      />
    </SafeAreaView>
  );
}

function RoutineRow({ routine }: { routine: MacroRoutine }) {
  return (
    <GlassCard>
      <View style={styles.row}>
        <View style={styles.rowMid}>
          <Text style={styles.routineName}>{routine.name}</Text>
          <Text style={styles.routineMeta}>
            "{routine.triggerPhrase}" · {routine.steps.length} step(s)
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Play ${routine.name}`}
          onPress={() => macroRecorder.enqueuePlayback(routine)}
          hitSlop={8}
        >
          <Ionicons name="play-circle" size={30} color={theme.palette.neon.primary} />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Delete ${routine.name}`}
          onPress={() => macroRecorder.remove(routine.id)}
          hitSlop={8}
        >
          <Ionicons name="trash-outline" size={20} color={theme.palette.text.mid} />
        </Pressable>
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.palette.navy.base },
  scroll: {
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
    gap: theme.spacing.sm,
  },
  heading: { color: theme.palette.text.high, fontSize: 24, fontWeight: '700' },
  caption: { color: theme.palette.text.mid, fontSize: 13, marginTop: 4 },
  recHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  recTitle: { color: theme.palette.text.high, fontSize: 15, fontWeight: '600' },
  quickWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: theme.spacing.md },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.palette.neon.faint,
    backgroundColor: 'rgba(74,144,226,0.10)',
  },
  chipPressed: { opacity: 0.7 },
  chipText: { color: theme.palette.text.high, fontSize: 12, fontWeight: '600' },
  input: {
    marginTop: theme.spacing.md,
    color: theme.palette.text.high,
    borderWidth: 1,
    borderColor: theme.palette.neon.faint,
    borderRadius: theme.radius.sm ?? 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 14,
  },
  btnRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: theme.spacing.md },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: theme.radius.sm ?? 8,
  },
  btnStart: { backgroundColor: theme.palette.neon.primary },
  btnStop: { backgroundColor: '#d9534f' },
  btnSave: { backgroundColor: theme.palette.success },
  btnDisabled: { opacity: 0.4 },
  btnGhost: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.palette.neon.faint,
  },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  btnGhostText: { color: theme.palette.text.mid, fontWeight: '600', fontSize: 13 },
  note: { color: theme.palette.text.mid, fontSize: 12, lineHeight: 17 },
  sectionTitle: {
    color: theme.palette.text.high,
    fontSize: 16,
    fontWeight: '700',
    marginTop: theme.spacing.md,
  },
  emptyText: { color: theme.palette.text.mid, fontSize: 13 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowMid: { flex: 1 },
  routineName: { color: theme.palette.text.high, fontSize: 15, fontWeight: '600' },
  routineMeta: { color: theme.palette.text.mid, fontSize: 12, marginTop: 2 },
});
