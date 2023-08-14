-- Up Migration

CREATE TABLE "transactions" (
  "hash" BYTEA NOT NULL,
  "from" BYTEA NOT NULL,
  "to" BYTEA NOT NULL,
  "value" NUMERIC NOT NULL,
  "data" BYTEA,
  "block_number" INT,
  "block_hash" BYTEA,
  "block_timestamp" INT,
  "gas" NUMERIC NOT NULL DEFAULT 0,
  "gas_price" NUMERIC NOT NULL DEFAULT 0,
  "max_fee_per_gas" NUMERIC NOT NULL DEFAULT 0,
  "max_priority_fee_per_gas" NUMERIC NOT NULL DEFAULT 0,
  "gas_used" NUMERIC NOT NULL DEFAULT 0,
  "cumulative_gas_used" NUMERIC NOT NULL DEFAULT 0,
  "effective_gas_price" NUMERIC NOT NULL DEFAULT 0,
  "contract_address" BYTEA,
  "logs_bloom" BYTEA,
  "status" BOOLEAN NOT NULL DEFAULT FALSE,
  "transaction_index" NUMERIC(78, 0) NOT NULL DEFAULT 0,
  "type" NUMERIC(78, 0) NOT NULL DEFAULT 0,
  "nonce" NUMERIC(78, 0) NOT NULL DEFAULT 0,
  "access_list" BYTEA,
  "r" BYTEA,
  "s" BYTEA,
  "v" NUMERIC(78, 0) NOT NULL DEFAULT 0,
);

ALTER TABLE "transactions"
  ADD CONSTRAINT "transactions_pk"
  PRIMARY KEY ("hash");

CREATE INDEX "transactions_to_index"
  ON "transactions" ("to");

CREATE INDEX "transactions_data_4bytes_index"
  ON "transactions" (substring("data" FROM length("data") - 3));

-- Down Migration

DROP TABLE "transactions";