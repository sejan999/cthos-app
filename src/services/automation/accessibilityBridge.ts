/**
 * Accessibility / System Bridge — automated tapping, typing, scrolling and
 * system toggles (brightness, hotspot, DND/silent, screen lock).
 *
 * STEP 4 architecture:
 *   - Native gestures/toggles go through the `CthosAccessibility` native
 *     module shipped by the custom Expo config plugin in the EAS dev-client
 *     build. In Expo Go it is absent; every capability then reports
 *     `ok: false` with a clear reason instead of crashing.
 *   - What runs today without native code: app opening via deep links
 *     (`whatsapp://`, `spotify://`, YouTube and generic schemes) via Linking.
 *   - executeStep()/executeSteps() is the single dispatcher used by macro
 *     playback and the command router; every step emits a trace event.
 */
import { Linking, NativeModules, Platform } from 'react-native';
import { AutomateStep } from './accessibilityBridge.types';

export type { AutomateStep, SystemToggle } from './accessibilityBridge.types';

export interface AutomationResult {
  ok: boolean;
  detail: string;
}

export type TraceListener = (step: AutomateStep, result: AutomationResult) => void;

/** Contract of the native module provided by the Cthos config plugin. */
interface CthosNativeAccessibility {
  tap(x: number, y: number): Promise<boolean>;
  typeText(text: string): Promise<boolean>;
  scroll(dir: 'up' | 'down'): Promise<boolean>;
  setSystemToggle(toggle: string): Promise<boolean>;
}

const native: CthosNativeAccessibility | undefined =
  (NativeModules as { CthosAccessibility?: CthosNativeAccessibility })
    .CthosAccessibility;

const APP_SCHEMES: Record<string, string> = {
  whatsapp: 'whatsapp://',
  whatsappbusiness: 'whatsapp-business://',
  spotify: 'spotify://',
  youtube: 'vnd.youtube://',
  telegram: 'tg://',
  instagram: 'instagram://',
  gmail: 'googlegmail://',
  maps: 'comgooglemaps://',
};

function normalizeKey(raw: string): string {
  return raw.toLowerCase().replace(/[^a-z]/g, '');
}

export class AccessibilityBridge {
  private traces = new Set<TraceListener>();

  /** Subscribe to per-step trace events during routine playback. */
  onTrace(listener: TraceListener): () => void {
    this.traces.add(listener);
    return () => {
      this.traces.delete(listener);
    };
  }

  /** True when the native gesture/toggle module is available on device. */
  get nativeAvailable(): boolean {
    return Platform.OS === 'android' && !!native;
  }

  async tap(x: number, y: number): Promise<AutomationResult> {
    if (!native) return this.unavailable('tap');
    try {
      const ok = await native.tap(x, y);
      return { ok, detail: ok ? `tapped ${x},${y}` : 'native tap rejected' };
    } catch (e) {
      console.warn('[Cthos:Bridge] tap failed', e);
      return { ok: false, detail: 'native tap threw on this device' };
    }
  }

  async type(text: string): Promise<AutomationResult> {
    if (!native) return this.unavailable('type');
    try {
      const ok = await native.typeText(text);
      return { ok, detail: ok ? `typed ${text.length} chars` : 'native typing rejected' };
    } catch (e) {
      console.warn('[Cthos:Bridge] type failed', e);
      return { ok: false, detail: 'native typing threw on this device' };
    }
  }

  async scroll(dir: 'up' | 'down'): Promise<AutomationResult> {
    if (!native) return this.unavailable('scroll');
    try {
      const ok = await native.scroll(dir);
      return { ok, detail: ok ? `scrolled ${dir}` : 'native scroll rejected' };
    } catch (e) {
      console.warn('[Cthos:Bridge] scroll failed', e);
      return { ok: false, detail: 'native scroll threw on this device' };
    }
  }

  async setSystemToggle(toggle: SystemToggle): Promise<AutomationResult> {
    if (!native) return this.unavailable(`toggle:${toggle}`);
    try {
      const ok = await native.setSystemToggle(toggle);
      return { ok, detail: ok ? `${toggle} toggled` : `native toggle ${toggle} rejected` };
    } catch (e) {
      console.warn('[Cthos:Bridge] toggle failed', e);
      return { ok: false, detail: `toggle "${toggle}" threw on this device` };
    }
  }

  /**
   * Open an app by name using deep links — works in Expo Go today. Falls
   * back to Android app settings when the scheme is unknown or the target is
   * not installed.
   */
  async openApp(app: string): Promise<AutomationResult> {
    const key = normalizeKey(app);
    const scheme = APP_SCHEMES[key];
    if (scheme) {
      try {
        await Linking.openURL(scheme);
        return { ok: true, detail: `opened ${key}` };
      } catch {
        /* not installed or blocked — fall through */
      }
    }
    try {
      await Linking.openSettings();
      return {
        ok: true,
        detail: `no direct link for "${app}" — opened settings instead`,
      };
    } catch {
      return { ok: false, detail: `unable to open "${app}"` };
    }
  }

  /** Execute one automation step and emit its trace. */
  async executeStep(step: AutomateStep): Promise<AutomationResult> {
    let result: AutomationResult;
    switch (step.op) {
      case 'tap':
        result =
          step.x !== undefined && step.y !== undefined
            ? await this.tap(step.x, step.y)
            : { ok: false, detail: 'tap missing x/y' };
        break;
      case 'type':
        result = step.text
          ? await this.type(step.text)
          : { ok: false, detail: 'type missing text' };
        break;
      case 'scroll':
        result = await this.scroll(step.dir ?? 'up');
        break;
      case 'toggle':
        result = step.toggle
          ? await this.setSystemToggle(step.toggle)
          : { ok: false, detail: 'toggle missing target' };
        break;
      case 'openApp':
        result = step.app
          ? await this.openApp(step.app)
          : { ok: false, detail: 'openApp missing app' };
        break;
      default:
        result = { ok: false, detail: `unknown op` };
    }
    for (const t of this.traces) t(step, { ...result });
    if (step.delayMs) await this.sleep(step.delayMs);
    return result;
  }

  /** Run a routine's steps sequentially; stops at the first hard failure. */
  async executeSteps(steps: AutomateStep[]): Promise<AutomationResult[]> {
    const results: AutomationResult[] = [];
    for (const step of steps) {
      const r = await this.executeStep(step);
      results.push(r);
      if (!r.ok) break;
    }
    return results;
  }

  private unavailable(capability: string): AutomationResult {
    return {
      ok: false,
      detail:
        `"${capability}" needs the CthosAccessibility native module — ` +
        'build a dev client via EAS',
    };
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((res) => setTimeout(res, ms));
  }
}

export const accessibilityBridge = new AccessibilityBridge();
