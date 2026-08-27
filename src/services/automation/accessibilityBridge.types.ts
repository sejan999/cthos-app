/**
 * Automation contract shared by the accessibility bridge, macro recorder and
 * command parser.
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
  /** Pause after this step completes (ms) — used for UI-settle waits. */
  delayMs?: number;
}
