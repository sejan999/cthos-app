/**
 * Mini-Cthos background worker framework.
 *
 * Executes async jobs on a priority queue WITHOUT blocking the main voice
 * conversation thread. STEP 4 features:
 *   - per-kind handler registry (register('whatsapp', handler) ...)
 *   - bounded concurrency (default 2 workers draining one priority queue)
 *   - job lifecycle events (queued -> running -> done|failed) for UI monitors
 *   - error capture stored on the job record itself
 *   - recent-history ring buffer for dashboards
 */
import { SubAgentJob, SubAgentKind } from '../types';

/** The handler contract — implemented by platform bridges/workers. */
export interface SubAgentHandler {
  execute(job: SubAgentJob): Promise<void>;
}

export type JobListener = (job: SubAgentJob) => void;

let seq = 0;
function nextId(kind: SubAgentKind): string {
  seq += 1;
  return `${kind}-${Date.now().toString(36)}-${seq}`;
}

export class SubAgentWorker {
  private queue: SubAgentJob[] = [];
  private handlers = new Map<SubAgentKind, SubAgentHandler>();
  private listeners = new Set<JobListener>();
  private activeCount = 0;
  private history: SubAgentJob[] = [];

  /** Max jobs executing simultaneously; the rest wait in the queue. */
  concurrency = 2;

  /** Register (or replace) the handler for a capability bucket. */
  register(kind: SubAgentKind, handler: SubAgentHandler): void {
    this.handlers.set(kind, handler);
  }

  /** Subscribe to every job status transition; returns an unsubscribe fn. */
  onJobUpdate(listener: JobListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  enqueue(job: Omit<SubAgentJob, 'createdAt' | 'status'>): SubAgentJob {
    const full: SubAgentJob = {
      ...job,
      id: job.id || nextId(job.kind),
      createdAt: Date.now(),
      status: 'queued',
    };
    this.queue.push(full);
    this.queue.sort((a, b) => b.priority - a.priority);
    this.notify(full);
    this.ensurePump();
    return full;
  }

  /**
   * Drain loop — claims the highest-priority queued job and runs it without
   * awaiting completion (bounded by `concurrency`), then re-pumps.
   */
  private ensurePump(): void {
    if (!this.queue.length) return;
    while (this.activeCount < this.concurrency && this.queue.length) {
      const job = this.queue.shift();
      if (!job) break;
      this.activeCount += 1;
      void this.runOne(job).finally(() => {
        this.activeCount -= 1;
        this.ensurePump();
      });
    }
  }

  private async runOne(job: SubAgentJob): Promise<void> {
    const handler = this.handlers.get(job.kind);
    if (!handler) {
      job.status = 'failed';
      job.error = `no handler registered for "${job.kind}"`;
      console.warn('[CthosSubAgent]', job.error);
      this.notify(job);
      return;
    }
    job.status = 'running';
    this.notify(job);
    try {
      await handler.execute(job);
      job.status = 'done';
    } catch (e) {
      job.status = 'failed';
      job.error = e instanceof Error ? e.message : String(e);
      console.error('[CthosSubAgent] job failed', job.id, e);
    }
    this.recordHistory(job);
    this.notify(job);
  }

  private recordHistory(job: SubAgentJob): void {
    if (job.status !== 'done' && job.status !== 'failed') return;
    this.history.push({ ...job });
    if (this.history.length > 50) this.history.shift();
  }

  private notify(job: SubAgentJob): void {
    for (const l of this.listeners) l({ ...job });
  }

  get length(): number {
    return this.queue.length;
  }

  get active(): number {
    return this.activeCount;
  }

  /** Last finished jobs (done/failed), newest last. */
  recent(count = 5): SubAgentJob[] {
    return this.history.slice(-count);
  }
}

export const subAgentWorker = new SubAgentWorker();
