/**
 * Command Router — STEP 4 glue between the voice loop and device automation.
 *
 * Installed as the audioStreamer ReplyProvider AHEAD of the Gemini brain:
 *   1. exact voice trigger match on saved routines -> play that routine
 *   2. deterministic parseCommand() hit            -> run its steps
 *   3. otherwise                                   -> fall through to Gemini
 *
 * All work executes through subAgentWorker (registered per-kind handlers) so
 * nothing blocks the live conversation thread, and every failure shows up in
 * the worker history for the dashboard.
 */
import { SubAgentJob, Utterance } from '../types';
import type { ReplyProvider } from '../voice/audioStreamer';
import { accessibilityBridge } from '../automation/accessibilityBridge';
import { parseCommand } from '../automation/commandParser';
import {
  MacroRoutine,
  macroRecorder,
  useMacroStore,
} from '../automation/macroRecorder';
import { whatsappService } from '../integrations/whatsappService';
import { SubAgentHandler, subAgentWorker } from './subAgentWorker';

/** Runs AutomateStep[] encoded as JSON in job.task. */
class AutomationHandler implements SubAgentHandler {
  async execute(job: SubAgentJob): Promise<void> {
    let steps;
    try {
      steps = JSON.parse(job.task) as MacroRoutine['steps'];
    } catch {
      throw new Error('automation job has malformed step payload');
    }
    const results = await accessibilityBridge.executeSteps(steps);
    if (!results.length) throw new Error('no executable steps');
    if (!results[results.length - 1].ok) {
      throw new Error(results[results.length - 1].detail);
    }
  }
}

/** Plays a saved routine: task === "play:<routineId>". */
class MacroHandler implements SubAgentHandler {
  async execute(job: SubAgentJob): Promise<void> {
    const id = job.task.replace(/^play:/, '');
    const routine = useMacroStore
      .getState()
      .routines.find((r) => r.id === id);
    if (!routine) throw new Error(`routine "${id}" not found`);
    await accessibilityBridge.executeSteps(routine.steps);
  }
}

/** Music: open the requested audio app (task = app name). */
class MusicHandler implements SubAgentHandler {
  async execute(job: SubAgentJob): Promise<void> {
    const result = await accessibilityBridge.openApp(job.task || 'spotify');
    if (!result.ok) throw new Error(result.detail);
  }
}

/** Register every STEP 4 capability on the shared worker (call once at boot). */
export function registerSubAgentHandlers(): void {
  subAgentWorker.register('automation', new AutomationHandler());
  subAgentWorker.register('macro', new MacroHandler());
  subAgentWorker.register('music', new MusicHandler());
  subAgentWorker.register('whatsapp', whatsappService);
}

class CommandRouter {
  private fallback: ReplyProvider | null = null;

  /** Chain the Gemini brain AFTER this router. */
  setFallback(provider: ReplyProvider): void {
    this.fallback = provider;
  }

  /** The ReplyProvider installed by initVoice(). */
  handleUtterance: ReplyProvider = async (u: Utterance) => {
    // 1) Named routine triggers win first ("hey cthos, good morning").
    const triggered = macroRecorder.matchVoiceTrigger(u.text);
    if (triggered) {
      macroRecorder.enqueuePlayback(triggered);
      return `Running ${triggered.name} now.`;
    }

    // 2) Deterministic automation intents.
    const cmd = parseCommand(u.text);
    if (cmd.isAutomation) {
      switch (cmd.kind) {
        case 'macro':
          return 'Use Macro Studio to pick which routine to run.';
        case 'whatsapp':
          void subAgentWorker.enqueue({
            kind: 'whatsapp',
            task: u.text.toLowerCase().includes('unread') || /read/.test(u.text.toLowerCase())
              ? 'read'
              : 'send',
            priority: 7,
          });
          break;
        case 'music': {
          const app = /spotify/i.test(u.text)
            ? 'spotify'
            : /youtube/i.test(u.text)
              ? 'youtube'
              : 'spotify';
          void subAgentWorker.enqueue({ kind: 'music', task: app, priority: 7 });
          break;
        }
        case 'automation':
        default: {
          if (cmd.steps.length) {
            void subAgentWorker.enqueue({
              kind: 'automation',
              task: JSON.stringify(cmd.steps),
              priority: 8,
            });
          }
          break;
        }
      }
      return cmd.ack ? `${cmd.ack}.` : 'On it.';
    }

    // 3) Conversational path — hand over to the Gemini brain.
    if (this.fallback) return this.fallback(u);
    return "I'm not sure how to do that yet.";
  };
}

export const commandRouter = new CommandRouter();
