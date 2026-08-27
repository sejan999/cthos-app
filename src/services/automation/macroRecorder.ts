/**
 * Macro Recorder & Routine store — records multi-step device actions and
 * plays them back via the sub-agent queue (voice-triggered or manual).
 *
 * Recording model: sessions capture steps pushed by callers
 * (`pushRecordedStep`) — in Expo Go these come from the Macro Studio UI;
 * once the CthosAccessibility native module ships, touch events stream into
 * the same buffer. Playback enqueues ONE macro job per routine so priority,
 * concurrency and failure history all flow through subAgentWorker.
 */
import { create } from 'zustand';
import { AutomateStep } from './accessibilityBridge.types';
import { SubAgentJob, SubAgentKind } from '../types';

export interface MacroRoutine {
  id: string;
  name: string;
  /** Lowercased phrase that voice triggers on ("good morning"). */
  triggerPhrase: string;
  steps: AutomateStep[];
  createdAt: number;
}

interface MacroState {
  routines: MacroRoutine[];
  isRecording: boolean;
  /** Steps captured in the CURRENT recording session. */
  recordingSteps: AutomateStep[];
  addRoutine: (r: MacroRoutine) => void;
  removeRoutine: (id: string) => void;
  setRecording: (v: boolean) => void;
  pushRecordedStep: (s: AutomateStep) => void;
}

let routineSeq = 0;

export const useMacroStore = create<MacroState>((set) => ({
  routines: [],
  isRecording: false,
  recordingSteps: [],
  addRoutine: (r) => set((s) => ({ routines: [...s.routines, r] })),
  removeRoutine: (id) =>
    set((s) => ({ routines: s.routines.filter((r) => r.id !== id) })),
  setRecording: (v) =>
    set(() =>
      v ? { isRecording: true, recordingSteps: [] } : { isRecording: false },
    ),
  pushRecordedStep: (s) =>
    set((st) => ({ recordingSteps: [...st.recordingSteps, s] })),
}));

export class MacroRecorder {
  private get store() {
    return useMacroStore.getState();
  }

  /** Build + persist a routine from the current recording session. */
  saveFromSession(name: string): MacroRoutine | null {
    const steps = this.store.recordingSteps;
    if (!steps.length) return null;
    routineSeq += 1;
    const routine: MacroRoutine = {
      id: `routine-${Date.now().toString(36)}-${routineSeq}`,
      name,
      triggerPhrase: name.toLowerCase(),
      steps: [...steps],
      createdAt: Date.now(),
    };
    this.store.addRoutine(routine);
    this.store.setRecording(false);
    return routine;
  }

  discardSession(): void {
    this.store.setRecording(false);
  }

  pushRecordedStep(step: AutomateStep): void {
    this.store.pushRecordedStep(step);
  }

  setRecording(v: boolean): void {
    this.store.setRecording(v);
  }

  list(): MacroRoutine[] {
    return this.store.routines;
  }

  remove(id: string): void {
    this.store.removeRoutine(id);
  }

  /** Exact / fuzzy trigger-phrase match for an utterance. */
  matchVoiceTrigger(utterance: string): MacroRoutine | null {
    const text = utterance.toLowerCase().replace(/[^a-z\s]/g, '').trim();
    if (!text) return null;
    return (
      this.store.routines.find(
        (r) =>
          r.triggerPhrase.length >= 3 &&
          (text.includes(r.triggerPhrase) || r.triggerPhrase === text),
      ) ?? null
    );
  }

  /**
   * Queue a routine's playback. Routed through subAgentWorker so it never
   * blocks the live conversation thread.
   */
  enqueuePlayback(routine: MacroRoutine, priority = 5): SubAgentJob {
    return enqueuePlaybackJob(
      `macro-${routine.id}-${Date.now().toString(36)}`,
      'macro',
      `play:${routine.id}`,
      priority,
    );
  }
}

// Placed at bottom to avoid a circular import at module scope;
// subAgentWorker only imports types from ../types.
import { subAgentWorker } from '../ai/subAgentWorker';

export function enqueuePlaybackJob(
  id: string,
  kind: SubAgentKind,
  task: string,
  priority = 5,
): SubAgentJob {
  return subAgentWorker.enqueue({ id, kind, task, priority });
}

