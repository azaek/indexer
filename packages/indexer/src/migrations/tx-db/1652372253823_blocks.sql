-- Up Migration

CREATE TABLE "blocks" (
  "hash" BYTEA NOT NULL,
  "number" INT NOT NULL,
  "timestamp" INT NOT NULL,
  "parent_hash" BYTEA NOT NULL,
  "nonce" BYTEA,
  "sha3_uncles" BYTEA NOT NULL,
  "logs_bloom" BYTEA NOT NULL,
  "transactions_root" BYTEA NOT NULL,
  "state_root" BYTEA NOT NULL,
  "receipts_root" BYTEA NOT NULL,
  "miner" BYTEA NOT NULL,
  "difficulty" BYTEA NOT NULL,
  "total_difficulty" BYTEA NOT NULL,
  "size" INT NOT NULL,
  "extra_data" BYTEA NOT NULL,
  "gas_limit" INT NOT NULL,
  "gas_used" INT NOT NULL,
  "base_fee_per_gas" INT,
  "uncles" BYTEA[] NOT NULL
);

ALTER TABLE "blocks"
  ADD CONSTRAINT "blocks_pk"
  PRIMARY KEY ("number", "hash");

-- Down Migration

DROP TABLE "blocks";