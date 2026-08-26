/**
 * Accessibility / System Bridge — automated tapping, typing, scrolling, and
 * system toggles (brightness, hotspot, DND/silent, screen lock).
 * Architecture contract only; native AccessibilityService & Intent glue is
 * implemented as a custom Expo Config Plugin / Native Module in STEP 4.
 */
export type SystemToggle =
  | 'brightness'
  | 'hotspot'
  | 'dnd'
  | 'silent'
  | 'screen_lock';

export interface AutomateStep {
  op: 'tap' | 'type' | 'scroll' | 'toggle' | 'openApp';
  x?: number;
  y?: number;
  text?: string;
  dir?: 'up' | 'down';
  toggle?: SystemToggle;
  app?: string;
  delayMs?: number;
}

/**
 * Bridge facade. All methods are planned native-backed; returns a trace object
 * so the Macro/automation layers are testable before a live device bridge.
 */
export class AccessibilityBridge {
  async tap(x: number, y: number): Promise<void> {
    // Native: dispatchGesture(Tap), measured x/y in screen px.
    void x; void y;
  }

  async type(text: string): Promise<void> {
    void text;
  }

  async scroll(dir: 'up' | 'down'): Promise<void> {
    void dir;
  }

  async setSystemToggle(toggle: SystemToggle): Promise<void> {
    void toggle;
  }
}

export const accessibilityBridge = new AccessibilityBridge();