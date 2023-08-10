import { logger } from "@/common/logger";
import { syncEvents } from "@/events-sync/index";
import { AbstractRabbitMqJobHandler, BackoffStrategy } from "@/jobs/abstract-rabbit-mq-job-handler";

import { checkSupports } from "@/events-sync/supports";
import { redis } from "@/common/redis";

export type EventsSyncHistoricalJobPayload = {
  block: number;
  syncEventsToMainDB?: boolean;
  backfillId?: string;
};

export class EventsSyncHistoricalJob extends AbstractRabbitMqJobHandler {
  queueName = "events-sync-historical";
  maxRetries = 30;
  concurrency = 300;
  consumerTimeout = 60 * 3000;
  backoff = {
    type: "fixed",
    delay: 1000,
  } as BackoffStrategy;

  constructor() {
    super();
    checkSupports();
  }
  protected async process(payload: EventsSyncHistoricalJobPayload) {
    try {
      const { block, syncEventsToMainDB } = payload;

      await syncEvents(block, syncEventsToMainDB);

      if (payload.backfillId) {
        const latestBlock = Number(await redis.get(`backfill:latestBlock:${payload.backfillId}`));
        const maxBlock = Number(await redis.get(`backfill:maxBlock:${payload.backfillId}`));
        if (block > latestBlock && block < maxBlock) {
          await redis.set(`backfill:latestBlock:${payload.backfillId}`, `${block}`);
          await this.addToQueue({
            block: block + 1,
            syncEventsToMainDB,
            backfillId: payload.backfillId,
          });
        }
      }
    } catch (error) {
      logger.warn(
        this.queueName,
        `Events historical syncing failed: ${error}, block=${payload.block}`
      );
      // skip this block and move on to the next one if its greater than the latest block

      if (payload.backfillId) {
        const latestBlock = Number(await redis.get(`backfill:latestBlock:${payload.backfillId}`));
        const maxBlock = Number(await redis.get(`backfill:maxBlock:${payload.backfillId}`));
        if (payload.backfillId && payload.block > latestBlock && payload.block < maxBlock) {
          await redis.set(`backfill:latestBlock:${payload.backfillId}`, `${latestBlock + 1}`);
          await this.addToQueue({
            block: latestBlock + 1,
            syncEventsToMainDB: payload.syncEventsToMainDB,
            backfillId: payload.backfillId,
          });
        }
      }

      // throw error;
    }
  }

  public async addToQueue(params: EventsSyncHistoricalJobPayload, delay = 0) {
    await this.send({ payload: params, jobId: `${params.block}` }, delay);
  }
}

export const eventsSyncHistoricalJob = new EventsSyncHistoricalJob();
