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
      if (!payload.fromBlock || !payload.toBlock) {
        return;
      }
      let backfillId = payload.backfillId;

      // if backfillId is provided, then we're resuming a backfill job. do this by going through the sorted set and adding each block to the queue
      if (backfillId) {
        // get list of backfill ids
        const backfillIds = await redis.lrange(`backfillIds:${backfillId}`, 0, -1);
        for (const batchBackfillId of backfillIds) {
          const fromBlock = await redis.get(`backfill:${batchBackfillId}:fromBlock`);
          if (!fromBlock) {
            logger.warn(
              this.queueName,
              `Events historical syncing failed: ${batchBackfillId} not found`
            );
            continue;
          }
          // add backfill to queue
          await eventsSyncHistoricalJob.addToQueue({
            block: parseInt(fromBlock),
            syncEventsToMainDB: payload.syncEventsToMainDB,
            batchBackfillId: batchBackfillId,
          });
        }

        return;
      } else {
        backfillId = `${payload.fromBlock}-${payload.toBlock}-${Date.now()}`;
      }

      logger.info(this.queueName, `Events historical syncing started: ${backfillId}`);
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

        const batchBackfillId = `${fromBlock}-${toBlock}-${Date.now()}`;
        // add batch backfill id to a list of backfill ids
        await redis.rpush(`backfillIds:${backfillId}`, batchBackfillId);
        await redis.set(`backfill:${batchBackfillId}:fromBlock`, `${fromBlock}`);
        await redis.set(`backfill:${batchBackfillId}:toBlock`, `${toBlock}`);

        // add backfill to queue
        await eventsSyncHistoricalJob.addToQueue({
          block: fromBlock,
          syncEventsToMainDB: payload.syncEventsToMainDB,
          batchBackfillId: batchBackfillId,
        });

        fromBlock = toBlock + 1;
        toBlock = fromBlock + range;
      }

      // handle remainder
      if (remainder > 0) {
        fromBlock = payload.toBlock - remainder + 1;
        toBlock = payload.toBlock;

        const batchBackfillId = `${fromBlock}-${toBlock}-${Date.now()}`;
        // add batch backfill id to a list of backfill ids
        await redis.rpush("backfillIds", batchBackfillId);
        await redis.set(`backfill:${batchBackfillId}:fromBlock`, `${fromBlock}`);
        await redis.set(`backfill:${batchBackfillId}:toBlock`, `${toBlock}`);

        // add backfill to queue
        await eventsSyncHistoricalJob.addToQueue({
          block: fromBlock,
          syncEventsToMainDB: payload.syncEventsToMainDB,
          batchBackfillId: batchBackfillId,
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
