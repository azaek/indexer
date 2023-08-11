import _ from "lodash";
import { txdb, pgp } from "@/common/db";
import { fromBuffer, toBuffer } from "@/common/utils";
import { logger } from "@/common/logger";
import { AccessList } from "ethers/lib/utils";

export type Transaction = {
  hash: string;
  from: string;
  to: string;
  value: string;
  data: string;
  blockNumber: number;
  blockHash: string;
  blockTimestamp: number;
  gasPrice?: string;
  gasUsed?: string;
  gasFee?: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
  cumulativeGasUsed?: string;
  contractAddress?: string;
  logsBloom?: string;
  status?: boolean;
  transactionIndex?: number;
  type?: number | null | undefined;
  nonce?: number;
  accessList?: AccessList | undefined;
  r?: string | undefined;
  s?: string | undefined;
  v?: number | undefined;
};

export const saveTransactions = async (transactions: Transaction[]) => {
  const CHUNK_SIZE = 10;

  // eslint-disable-next-line
  // console.log(JSON.stringify(transactions));

  if (_.isEmpty(transactions)) {
    return;
  }

  const columns = new pgp.helpers.ColumnSet(
    [
      "hash",
      "from",
      "to",
      "value",
      "data",
      "block_number",
      "block_hash",
      "block_timestamp",
      "gas",
      "gas_price",
      "max_fee_per_gas",
      "max_priority_fee_per_gas",
      "gas_used",
      "cumulative_gas_used",
      "effective_gas_price",
      "contract_address",
      "logs_bloom",
      "status",
      "transaction_index",
      "type",
      "nonce",
      "access_list",
      "r",
      "s",
      "v",
    ],
    { table: "transactions" }
  );

  const transactionsValues = _.map(transactions, (transaction) => ({
    hash: toBuffer(transaction.hash),
    from: toBuffer(transaction.from),
    to: toBuffer(transaction.to),
    value: transaction.value,
    data: toBuffer(transaction.data),
    block_number: transaction.blockNumber,
    block_hash: toBuffer(transaction.blockHash),
    block_timestamp: transaction.blockTimestamp,
    gas: transaction.gasPrice,
    gas_price: transaction.gasPrice,
    max_fee_per_gas: transaction.maxFeePerGas,
    max_priority_fee_per_gas: transaction.maxPriorityFeePerGas,
    gas_used: transaction.gasUsed,
    cumulative_gas_used: transaction.cumulativeGasUsed,
    effective_gas_price: transaction.gasPrice,
    contract_address: transaction?.contractAddress ? toBuffer(transaction.contractAddress) : null,
    logs_bloom: transaction?.logsBloom ? toBuffer(transaction.logsBloom) : null,
    status: transaction.status,
    transaction_index: Number(transaction.transactionIndex),
    type: transaction.type,
    nonce: transaction.nonce,
    access_list: transaction.accessList,
    r: transaction.r,
    s: transaction.s,
    v: transaction.v,
  }));

  const chunks = _.chunk(transactionsValues, CHUNK_SIZE);

  await Promise.all(
    chunks.map(async (chunk) => {
      try {
        await txdb.none(
          `
        INSERT INTO transactions (
          ${columns.names}
        ) VALUES ${pgp.helpers.values(chunk, columns)}
        ON CONFLICT DO NOTHING
      `
        );
      } catch (error) {
        logger.error(
          "sync-events",
          `Error saving transactions: ${error}, ${JSON.stringify(chunk)}`
        );
      }
    })
  );
};

export const getTransaction = async (hash: string): Promise<Transaction> => {
  const result = await txdb.oneOrNone(
    `
      SELECT
        transactions.hash,  
        transactions.from,
        transactions.to,
        transactions.value,
        transactions.data,
        transactions.block_number,
        transactions.block_hash,
        transactions.block_timestamp,
        transactions.gas_price,
        transactions.gas_used,
        transactions.max_fee_per_gas,
        transactions.max_priority_fee_per_gas,
        transactions.cumulative_gas_used,
        transactions.status,
        transactions.transaction_index,
        transactions.type,
        transactions.nonce,
        transactions.access_list,
        transactions.r,
        transactions.s,
        transactions.v
      FROM transactions
      WHERE transactions.hash = $/hash/
    `,
    { hash: toBuffer(hash) }
  );

  return {
    hash,
    from: fromBuffer(result.from),
    to: fromBuffer(result.to),
    value: result.value,
    data: fromBuffer(result.data),
    blockNumber: result.block_number,
    blockHash: fromBuffer(result.block_hash),
    blockTimestamp: result.block_timestamp,
    gasPrice: result.gas_price,
    gasUsed: result.gas_used,
    maxFeePerGas: result.max_fee_per_gas,
    maxPriorityFeePerGas: result.max_priority_fee_per_gas,
    cumulativeGasUsed: result.cumulative_gas_used,
    status: result.status,
    transactionIndex: result.transaction_index,
    type: result.type,
    nonce: result.nonce,
    accessList: result.access_list,
    r: result.r,
    s: result.s,
    v: result.v,
  };
};

export const deleteBlockTransactions = async (blockHash: string) => {
  await txdb.none(
    `
      DELETE FROM transactions
      WHERE transactions.block_hash = $/blockHash/
    `,
    { blockHash: toBuffer(blockHash) }
  );
};
