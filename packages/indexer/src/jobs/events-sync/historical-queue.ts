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
  concurrency = 1;
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
        const latestBlock = Number(
          (await redis.zrevrange(`backfill:${payload.backfillId}`, 0, 0, "WITHSCORES"))[1]
        );
        const maxBlock = Number(
          (await redis.zrange(`backfill:${payload.backfillId}`, 0, 0, "WITHSCORES"))[1]
        );

        if (block > latestBlock && block < maxBlock) {
          await redis.zadd(`backfill:${payload.backfillId}`, `${block}`, "fromBlock");
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
        const latestBlock = Number(
          (await redis.zrevrange(`backfill:${payload.backfillId}`, 0, 0, "WITHSCORES"))[1]
        );
        const maxBlock = Number(
          (await redis.zrange(`backfill:${payload.backfillId}`, 0, 0, "WITHSCORES"))[1]
        );

        await redis.sadd(`backfill:failed:${payload.backfillId}`, `${payload.block}`);
        if (payload.backfillId && payload.block > latestBlock && payload.block < maxBlock) {
          await redis.zadd(`backfill:${payload.backfillId}`, `${latestBlock + 1}`, "fromBlock");
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
