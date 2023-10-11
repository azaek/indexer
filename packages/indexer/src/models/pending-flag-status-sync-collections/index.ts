import _ from "lodash";
import { redis } from "@/common/redis";
import { config } from "@/config/index";

export type PendingFlagStatusSyncCollection = {
  slug: string | null;
  contract: string;
  continuation: string | null;
  collectionId: string;
};

/**
 * Class that manage redis list of tokens, pending metadata sync
 */
export class PendingFlagStatusSyncCollections {
  public static key = "pending-flag-status-sync-collections";

  public static async add(syncCollection: PendingFlagStatusSyncCollection[], prioritized = false) {
    if (config.metadataIndexingMethodCollection === "opensea") {
      return;
    }
    if (prioritized) {
      return await redis.lpush(
        this.key,
        _.map(syncCollection, (token) => JSON.stringify(token))
      );
    } else {
      return await redis.rpush(
        this.key,
        _.map(syncCollection, (token) => JSON.stringify(token))
      );
    }
  }

  public static async get(count = 20): Promise<PendingFlagStatusSyncCollection[]> {
    const syncCollections = await redis.lpop(this.key, count);
    if (syncCollections) {
      return _.map(
        syncCollections,
        (syncCollection) => JSON.parse(syncCollection) as PendingFlagStatusSyncCollection
      );
    }

    return [];
  }

  public static async count(): Promise<number> {
    return await redis.llen(this.key);
  }
}
