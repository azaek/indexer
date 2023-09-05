import { logger } from "@/common/logger";
import { syncTraces } from "@/events-sync/index";
import { AbstractRabbitMqJobHandler, BackoffStrategy } from "@/jobs/abstract-rabbit-mq-job-handler";

import { checkSupports } from "@/events-sync/supports";
import { config } from "@/config/index";

export type TraceSyncJobPayload = {
  block: number;
};

export class TraceSyncJob extends AbstractRabbitMqJobHandler {
  queueName = "trace-sync-job";
  maxRetries = 30;
  concurrency = config.txWorkConcurrency;
  consumerTimeout = 60 * 3000;
  backoff = {
    type: "fixed",
    delay: 1000,
  } as BackoffStrategy;

  constructor() {
    super();
    checkSupports();
  }
  protected async process(payload: TraceSyncJobPayload) {
    try {
      const { block } = payload;
      await syncTraces(block);
    } catch (error) {
      logger.warn(
        this.queueName,
        `Events historical syncing failed: ${error}, block=${payload.block}`
      );
    }
  }

  public async addToQueue(params: TraceSyncJobPayload, delay = 0) {
    await this.send({ payload: params, jobId: `${params.block}` }, delay);
  }
}

export const traceSyncJob = new TraceSyncJob();
