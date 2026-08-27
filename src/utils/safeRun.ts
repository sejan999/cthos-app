/**
 * Safe-run utilities — bulletproof async boundaries used across boot, voice
 * hooks and native bridges. On Hermes AND JSC an unhandled promise rejection
 * can tear down the JS context on Android (manifesting as a sudden
 * "auto-back" to the launcher); every fire-and-forget call in Cthos routes
 * through these helpers so nothing is ever left unhandled.
 */

export interface SafeResult<T> {
  ok: boolean;
  value?: T;
  error?: unknown;
}

/**
 * Await an async task without ever throwing. Returns { ok:false } on any
 * rejection or synchronous throw.
 */
export async function runSafe<T>(
  label: string,
  task: () => Promise<T> | T,
): Promise<SafeResult<T>> {
  try {
    const value = await task();
    return { ok: true, value };
  } catch (error) {
    console.warn(`[Cthos:safe] ${label} failed`, error);
    return { ok: false, error };
  }
}

/**
 * Fire-and-forget wrapper for promises you intentionally don't await.
 * Guarantees rejections are logged instead of becoming unhandled.
 */
export function forget(label: string, task: Promise<unknown> | (() => unknown)): void {
  try {
    const p = typeof task === 'function' ? (task as () => unknown)() : task;
    if (p && typeof (p as Promise<unknown>).then === 'function') {
      (p as Promise<unknown>).catch((error) =>
        console.warn(`[Cthos:safe] ${label} rejected`, error),
      );
    }
  } catch (error) {
    console.warn(`[Cthos:safe] ${label} threw synchronously`, error);
  }
}

/**
 * Best-effort install of a global JS error trap so no fatal ever disappears
 * silently. Must never itself throw (guarded feature detection).
 */
export function installGlobalErrorTrap(): void {
  try {
    const g = globalThis as {
      ErrorUtils?: {
        getGlobalHandler?: () => (e: unknown, fatal?: boolean) => void;
        setGlobalHandler?: (handler: (e: unknown, fatal?: boolean) => void) => void;
      };
    };
    const prev = g.ErrorUtils?.getGlobalHandler?.bind(g.ErrorUtils);
    if (g.ErrorUtils && typeof g.ErrorUtils.setGlobalHandler === 'function') {
      g.ErrorUtils.setGlobalHandler((error, fatal) => {
        console.error('[Cthos:Global]', fatal ? 'FATAL' : 'recoverable', error);
        // Chain to any pre-installed handler (e.g. dev tools).
        try {
          if (prev) prev(error, fatal);
        } catch {
          /* never throw from the trap */
        }
      });
    }
  } catch {
    /* engines without ErrorUtils simply skip the trap */
  }
}
