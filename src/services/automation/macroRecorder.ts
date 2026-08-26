/**
 * Macro Recorder & Routine store — records multi-step device actions and
 * allows voice-triggered playback. STEP 4 builds the recording UI/native capture;
 * contract defined now.
 */
import { AutomateStep } from '../automation/accessibilityBridge';
import { create } from 'zustand';

export interface MacroRoutine {
  id: string;
  name: string;
  triggerPhrase: string;
  steps: AutomateStep[];
  createdAt: number;
}

interface MacroState {
  routines: MacroRoutine[];
  isRecording: boolean;
  addRoutine: (r: MacroRoutine) => void;
  removeRoutine: (id: string) => void;
  setRecording: (v: boolean) => void;
}

export const useMacroStore = create<MacroState>((set) => ({
  routines: [],
  isRecording: false,
  addRoutine: (r) => set((s) => ({ routines: [...s.routines, r] })),
  removeRoutine: (id) =>
    set((s) => ({ routines: s.routines.filter((r) => r.id !== id) })),
  setRecording: (v) => set({ isRecording: v }),
}));