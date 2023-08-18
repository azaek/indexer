import { logger } from "@/common/logger";
import { syncEvents } from "@/events-sync/index";
import { AbstractRabbitMqJobHandler, BackoffStrategy } from "@/jobs/abstract-rabbit-mq-job-handler";

import { checkSupports } from "@/events-sync/supports";
import { redis } from "@/common/redis";

export type EventsSyncHistoricalJobPayload = {
  block: number;
  syncEventsToMainDB?: boolean;
  batchBackfillId?: string;
};

export class EventsSyncHistoricalJob extends AbstractRabbitMqJobHandler {
  queueName = "events-sync-historical";
  maxRetries = 30;
  concurrency = 100;
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
    } catch (error) {
      logger.warn(
        this.queueName,
        `Events historical syncing failed: ${error}, block=${payload.block}`
      );
    }
    await this.addNextBlockToQueue(payload);
  }

  public async addNextBlockToQueue(payload: EventsSyncHistoricalJobPayload) {
    const { block, syncEventsToMainDB } = payload;
    if (payload.batchBackfillId) {
      const latestBlock = Number(await redis.get(`backfill:${payload.batchBackfillId}:fromBlock`));
      const maxBlock = Number(await redis.get(`backfill:${payload.batchBackfillId}:toBlock`));

      if (block > latestBlock - 1 && block < maxBlock) {
        // await redis.set(`backfill:${payload.batchBackfillId}:fromBlock`, `${block}`);
        await this.addToQueue({
          block: block + 1,
          syncEventsToMainDB,
          batchBackfillId: payload.batchBackfillId,
        });
      }
    }
  }

  public async addToQueue(params: EventsSyncHistoricalJobPayload, delay = 0) {
    await this.send({ payload: params, jobId: `${params.block}` }, delay);
  }
}

export const eventsSyncHistoricalJob = new EventsSyncHistoricalJob();
