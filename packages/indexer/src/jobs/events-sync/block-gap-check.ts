// import { AbstractRabbitMqJobHandler, BackoffStrategy } from "@/jobs/abstract-rabbit-mq-job-handler";

// import { logger } from "@/common/logger";
import { txdb } from "@/common/db";
// import { eventsSyncRealtimeJob } from "@/jobs/events-sync/events-sync-realtime-job";
// import { config } from "@/config/index";

import { Queue, QueueScheduler } from "bullmq";

import { redis } from "@/common/redis";

// import { randomUUID } from "crypto";
import { eventsSyncHistoricalJob } from "./historical-queue";
import { logger } from "ethers";
// import { events } from "@elastic/elasticsearch";

const QUEUE_NAME = "block-gap-check";

export const queue = new Queue(QUEUE_NAME, {
  connection: redis.duplicate(),
  defaultJobOptions: {
    attempts: 5,
    backoff: {
      type: "exponential",
      delay: 1000,
    },
    removeOnComplete: 1000,
    removeOnFail: 1000,
    timeout: 60000,
  },
});
new QueueScheduler(QUEUE_NAME, { connection: redis.duplicate() });

export const processBlockGapCheckJob = async (offset?: number) => {
  try {
    // const start = 46405059;
    // const end = 46832066;

    // await eventsSyncHistoricalJob.addToQueueBatch(
    //   Array.from({ length: end - start + 1 }, (_, i) => ({
    //     block: start + i,
    //     syncEventsToMainDB: false,
    //   }))
    // );

    // if (start) {
    //   return;
    // }

    const limit = 1000000;
    if (offset && offset >= 48_000_000) {
      logger.info(QUEUE_NAME, `Reached block ${offset}`);
      return;
    }
    const missingBlocks = await txdb.query(
      `WITH last_blocks AS (
        SELECT number
        FROM blocks
        ORDER BY number ASC
        LIMIT ${limit}
        ${offset ? `OFFSET ${offset}` : ""}
        ),
        sequence AS (
        SELECT generate_series(
            (SELECT min(number) FROM last_blocks),
            (SELECT max(number) FROM last_blocks)
        ) AS number
        )
        SELECT s.number AS missing_block_number
        FROM sequence s
        LEFT JOIN last_blocks lb ON s.number = lb.number
        WHERE lb.number IS NULL
        ORDER BY s.number`
    );

    if (missingBlocks.length > 0) {
      // const delay = missingBlocks.length > 100 ? 1000 : 0;

      // logger.info(QUEUE_NAME, `Found missing blocks: ${missingBlocks.length}`);
      // for (let i = 0; i < missingBlocks.length; i++) {
      //   await eventsSyncHistoricalJob.addToQueue(
      //     {
      //       block: missingBlocks[i].missing_block_number,
      //       syncEventsToMainDB: false,
      //     }
      //     // delay * i
      //   );
      // }

      await eventsSyncHistoricalJob.addToQueueBatch(
        missingBlocks.map((block: { missing_block_number: number }) => ({
          block: block.missing_block_number,
          syncEventsToMainDB: false,
        }))
      );
    }
    await processBlockGapCheckJob(offset ? offset + limit : limit);
  } catch (error) {
    logger.warn(QUEUE_NAME, `Failed to check block gap: ${error}`);

    throw error;
  }
};

// if (config.doBackgroundWork && config.doWebsocketServerWork) {
//   const worker = new Worker(
//     QUEUE_NAME,
//     async () => {
//       await processBlockGapCheckJob();
//     },
//     {
//       connection: redis.duplicate(),
//       concurrency: 1,
//     }
//   );
//   worker.on("error", (error) => {
//     logger.error(QUEUE_NAME, `Worker errored. error=${JSON.stringify(error)}`);
//   });
// }

// eslint-disable-next-line
// console.log("processBlockGapCheckJob");

// export const addToQueue = async () => {
//   if (!config.doBackgroundWork) {
//     return;
//   }

//   await queue.add(
//     QUEUE_NAME,
//     {},
//     {
//       jobId: randomUUID(),
//     }
//   );
// };

// export class BlockGapCheckJob extends AbstractRabbitMqJobHandler {
//   queueName = "block-gap-check";
//   maxRetries = 30;
//   concurrency = 5;
//   backoff = {
//     type: "fixed",
//     delay: 100,
//   } as BackoffStrategy;

//   protected async process() {
//     await processBlockGapCheckJob();
//   }

//   public async addToQueue() {
//     await this.send();
//   }
// }

// export const blockGapCheckJob = new BlockGapCheckJob();

// if (config.doBackgroundWork) {
//   cron.schedule(
//     // Every 10 minutes
//     "*/10 * * * *",
//     async () =>
//       await redlock
//         .acquire(["block-gap-check-lock"], (10 * 60 - 3) * 1000)
//         .then(async () => {
//           logger.info("block-gap-check", "triggering block gap check");
//           //   await blockGapCheckJob.addToQueue();
//           await addToQueue();
//         })
//         .catch(() => {
//           // Skip any errors
//         })
//   );
// }
