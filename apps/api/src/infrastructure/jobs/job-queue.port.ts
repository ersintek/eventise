export interface EnqueueJob { type: string; payload: Record<string, unknown>; runAt?: Date; idempotencyKey?: string; maxAttempts?: number; }
export abstract class JobQueue { abstract enqueue(job: EnqueueJob): Promise<{ id: string }>; }
