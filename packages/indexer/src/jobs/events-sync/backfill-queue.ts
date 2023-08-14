import { logger } from "@/common/logger";
import { redis } from "@/common/redis";

import { AbstractRabbitMqJobHandler, BackoffStrategy } from "@/jobs/abstract-rabbit-mq-job-handler";
import { eventsSyncHistoricalJob } from "@/jobs/events-sync/historical-queue";

export type EventsBackfillJobPayload = {
  fromBlock?: number;
  toBlock?: number;
  backfillId?: string;
  syncEventsToMainDB?: boolean;
  chunkSize?: number;
};

export class EventsBackfillJob extends AbstractRabbitMqJobHandler {
  queueName = "events-backfill-job";
  maxRetries = 30;
  concurrency = 1;
  consumerTimeout = 60 * 1000;
  backoff = {
    type: "fixed",
    delay: 1000,
  } as BackoffStrategy;

  constructor() {
    super();
  }
  protected async process(payload: EventsBackfillJobPayload) {
    try {
      if (!payload.fromBlock || !payload.toBlock || !payload.backfillId) {
        return;
      }

      // if backfillId is provided, then we're resuming a backfill job. do this by going through the sorted set and adding each block to the queue
      if (payload.backfillId) {
        const latestBlock = Number(
          (await redis.zrevrange(`backfill:${payload.backfillId}`, 0, 0, "WITHSCORES"))[1]
        );

        const maxBlock = Number(
          (await redis.zrange(`backfill:${payload.backfillId}`, 0, 0, "WITHSCORES"))[1]
        );

        if (payload.fromBlock > latestBlock && payload.fromBlock < maxBlock) {
          await redis.zadd(`backfill:${payload.backfillId}`, `${payload.fromBlock}`, "fromBlock");
          await eventsSyncHistoricalJob.addToQueue({
            block: payload.fromBlock,
            syncEventsToMainDB: payload.syncEventsToMainDB,
            backfillId: payload.backfillId,
          });
        }
        return;
      }

      const chunkSize = payload.chunkSize || 300;
      // split backfill into chunks, each with their own backfillId. Chunk count is the number of chunks to split the backfill into

      const range = Math.floor((payload.toBlock - payload.fromBlock) / chunkSize);
      const remainder = (payload.toBlock - payload.fromBlock) % chunkSize;

      let fromBlock = payload.fromBlock;
      let toBlock = payload.fromBlock + range;

      for (let i = 0; i < chunkSize; i++) {
        if (i === chunkSize - 1) {
          toBlock = payload.toBlock;
        }

        const backfillId = `${fromBlock}-${toBlock}-${Date.now()}`;
        // set max block for this backfill, and latest block to the fromBlock
        // await redis.set(`backfill:maxBlock:${backfillId}`, `${toBlock}`);
        // await redis.set(`backfill:latestBlock:${backfillId}`, `${fromBlock - 1}`);

        await redis.zadd(
          `backfill:${backfillId}`,
          `${payload.fromBlock}`,
          "fromBlock",
          `${payload.toBlock}`,
          "toBlock"
        );

        // add backfill to queue
        await eventsSyncHistoricalJob.addToQueue({
          block: fromBlock,
          syncEventsToMainDB: payload.syncEventsToMainDB,
          backfillId,
        });

        fromBlock = toBlock + 1;
        toBlock = fromBlock + range;
      }

      // handle remainder
      if (remainder > 0) {
        const backfillId = `${fromBlock}-${payload.toBlock}-${Date.now()}`;
        // set max block for this backfill, and latest block to the fromBlock

        await redis.zadd(
          `backfill:${backfillId}`,
          `${payload.fromBlock}`,
          "fromBlock",
          `${payload.toBlock}`,
          "toBlock"
        );

        await redis.zadd(`backfill:${backfillId}`, `${fromBlock}`, "fromBlock");

        // add backfill to queue
        await eventsSyncHistoricalJob.addToQueue({
          block: fromBlock,
          syncEventsToMainDB: payload.syncEventsToMainDB,
          backfillId,
        });
      }
      return;
    } catch (error) {
      logger.warn(this.queueName, `Events historical syncing failed: ${error}`);
      throw error;
    }
  }

  public async addToQueue(params: EventsBackfillJobPayload, delay = 0) {
    await this.send({ payload: params }, delay);
  }
}

export const eventsBackfillJob = new EventsBackfillJob();
