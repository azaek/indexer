import { AbstractRabbitMqJobHandler } from "@/jobs/abstract-rabbit-mq-job-handler";

import { detectTokenStandard, getContractNameAndSymbol, getContractOwner } from "./utils";
import { logger } from "@/common/logger";
import { idb } from "@/common/db";
import { toBuffer } from "@/common/utils";

export type CollectionContractDeployed = {
  contract: string;
};

export class CollectionNewContractDeployedJob extends AbstractRabbitMqJobHandler {
  queueName = "collections-refresh-cache";
  maxRetries = 10;
  concurrency = 10;
  persistent = false;

  protected async process(payload: CollectionContractDeployed) {
    const { contract } = payload;

    // get the type of the collection, either ERC721 or ERC1155. if it's not one of those, we don't care
    // get this from the contract itself
    const collectionKind = await detectTokenStandard(contract);

    switch (collectionKind) {
      case "ERC721":
      case "ERC1155":
        break;
      case "Both":
        logger.warn(
          this.queueName,
          `Collection ${contract} is both ERC721 and ERC1155. This is not supported yet.`
        );
        break;
      default:
        return;
    }

    const [contractOwner, contractName] = await Promise.all([
      getContractOwner(contract),
      getContractNameAndSymbol(contract),
    ]);

    await Promise.all([
      idb.none(
        `
        INSERT INTO contracts (
          address,
          kind
        ) VALUES (
          $/address/,
          $/kind/
        )
      `,
        {
          address: contract,
          kind: collectionKind.toLowerCase(),
        }
      ),
      idb.none(
        `
              INSERT INTO collections (
                id,
                name,
                contract,
                creator
              ) VALUES (
                $/id/,
                $/name/,
                $/contract/,
                $/creator/
              ) ON CONFLICT DO NOTHING
            `,
        {
          id: contract,
          name: contractName || null,
          contract: toBuffer(contract),
          creator: contractOwner,
        }
      ),
    ]);
  }

  public async addToQueue(params: CollectionContractDeployed) {
    await this.send({ payload: params });
  }
}

export const collectionNewContractDeployedJob = new CollectionNewContractDeployedJob();
