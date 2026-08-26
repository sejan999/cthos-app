/**
 * Mini-Cthos background worker queue. Executes async jobs on a priority queue
 * WITHOUT blocking the main voice conversation thread. STEP 4 fleshes out the
 * real concurrency + persistence; this establishes the contract.
 */
import { SubAgentJob, SubAgentStatus } from '../types';

type JobHandler = (job: SubAgentJob) => Promise<void>;

export class SubAgentWorker {
  private queue: SubAgentJob[] = [];
  private running = false;
  private handler: SubAgentHandler | null = null;

  setHandler(h: SubAgentHandler) {
    this.handler = h;
  }

  enqueue(job: Omit<SubAgentJob, 'createdAt' | 'status'>): SubAgentJob {
    const full: SubAgentJob = {
      ...job,
      createdAt: Date.now(),
      status: 'queued',
    };
    this.queue.push(full);
    this.queue.sort((a, b) => b.priority - a.priority);
    this.pump();
    return full;
  }

  private async pump() {
    if (this.running) return;
    this.running = true;
    while (this.queue.length) {
      const job = this.queue.shift()!;
      job.status = 'running';
      if (this.handler) {
        try {
          await this.handler.execute(job);
          job.status = 'done';
        } catch (e) {
          job.status = 'failed';
          console.error('[CthosSubAgent] job failed', job.id, e);
        }
      }
    }
    this.running = false;
  }

  get length() {
    return this.queue.length;
  }
}

/** The handler contract — implemented by platform bridges/workers. */
export interface SubAgentHandler {
  execute(job: SubAgentJob): Promise<void>;
}

export const subAgentWorker = new SubAgentWorker();