import { randomUUID } from "node:crypto";
import { query, withTransaction } from "@gateway/database";

export interface OutboxEvent {
  id: string;
  topic: string;
  aggregateType: string;
  aggregateId: string;
  payload: unknown;
  attempts: number;
}

export type OutboxHandler = (event: OutboxEvent) => Promise<void>;

export interface OutboxWorkerOptions {
  handlers?: Readonly<Record<string, OutboxHandler>>;
  workerId?: string;
  maxAttempts?: number;
}

export interface OutboxWorker {
  runOnce(): Promise<number>;
}

interface ClaimedRow {
  id: string;
  topic: string;
  aggregate_type: string;
  aggregate_id: string;
  payload: unknown;
  attempts: number;
}

function retryDelaySeconds(attempts: number): number {
  return Math.min(300, 2 ** Math.max(0, attempts - 1));
}

export function createOutboxWorker(options: OutboxWorkerOptions = {}): OutboxWorker {
  const handlers = options.handlers ?? {};
  const workerId = options.workerId ?? `worker-${randomUUID()}`;
  const maxAttempts = options.maxAttempts ?? 10;
  const topics = Object.keys(handlers);

  return {
    async runOnce(): Promise<number> {
      if (topics.length === 0) return 0;
      const claimed = await withTransaction(async (client) => {
        const result = await client.query<ClaimedRow>(
          `UPDATE outbox_events event
           SET status='PROCESSING', attempts=event.attempts+1, locked_at=now(), locked_by=$1
           WHERE event.id = (
             SELECT candidate.id FROM outbox_events candidate
             WHERE candidate.topic = ANY($2::text[])
               AND candidate.status IN ('PENDING','RETRY')
               AND candidate.available_at <= now()
             ORDER BY candidate.created_at
             FOR UPDATE SKIP LOCKED
             LIMIT 1
           )
           RETURNING event.id, event.topic, event.aggregate_type, event.aggregate_id, event.payload, event.attempts`,
          [workerId, topics]
        );
        return result.rows[0];
      });

      if (!claimed) return 0;
      const event: OutboxEvent = {
        id: claimed.id,
        topic: claimed.topic,
        aggregateType: claimed.aggregate_type,
        aggregateId: claimed.aggregate_id,
        payload: claimed.payload,
        attempts: claimed.attempts
      };
      const handler = handlers[event.topic];
      if (!handler) return 0;

      try {
        await handler(event);
        await query(
          `UPDATE outbox_events SET status='PROCESSED', processed_at=now(), locked_at=NULL, locked_by=NULL, last_error=NULL WHERE id=$1 AND status='PROCESSING' AND locked_by=$2`,
          [event.id, workerId]
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : "outbox handler failed";
        const terminal = event.attempts >= maxAttempts;
        await query(
          `UPDATE outbox_events
           SET status=$1, available_at=now() + ($2 * interval '1 second'), locked_at=NULL, locked_by=NULL, last_error=$3
           WHERE id=$4 AND status='PROCESSING' AND locked_by=$5`,
          [terminal ? "DEAD" : "RETRY", terminal ? 0 : retryDelaySeconds(event.attempts), message.slice(0, 1000), event.id, workerId]
        );
      }
      return 1;
    }
  };
}
