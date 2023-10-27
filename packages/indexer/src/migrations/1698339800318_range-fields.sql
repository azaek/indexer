-- Up Migration

ALTER TABLE "orders" ADD COLUMN "valid_from" TIMESTAMPTZ;
ALTER TABLE "orders" ADD COLUMN "valid_to" TIMESTAMPTZ;

ALTER TABLE "collections" ADD COLUMN "floor_sell_valid_from" TIMESTAMPTZ;
ALTER TABLE "collections" ADD COLUMN "floor_sell_valid_to" TIMESTAMPTZ;

ALTER TABLE "collections" ADD COLUMN "normalized_floor_sell_valid_from" TIMESTAMPTZ;
ALTER TABLE "collections" ADD COLUMN "normalized_floor_sell_valid_to" TIMESTAMPTZ;

ALTER TABLE "collections" ADD COLUMN "top_buy_valid_from" TIMESTAMPTZ;
ALTER TABLE "collections" ADD COLUMN "top_buy_valid_to" TIMESTAMPTZ;

ALTER TABLE "collections" ADD COLUMN "non_flagged_floor_sell_valid_from" TIMESTAMPTZ;
ALTER TABLE "collections" ADD COLUMN "non_flagged_floor_sell_valid_to" TIMESTAMPTZ;

ALTER TABLE "token_floor_sell_events" ADD COLUMN "valid_from" TIMESTAMPTZ;
ALTER TABLE "token_floor_sell_events" ADD COLUMN "valid_to" TIMESTAMPTZ;

ALTER TABLE "token_normalized_floor_sell_events" ADD COLUMN "valid_from" TIMESTAMPTZ;
ALTER TABLE "token_normalized_floor_sell_events" ADD COLUMN "valid_to" TIMESTAMPTZ;

ALTER TABLE "collection_floor_sell_events" ADD COLUMN "order_valid_from" TIMESTAMPTZ;
ALTER TABLE "collection_floor_sell_events" ADD COLUMN "order_valid_to" TIMESTAMPTZ;

ALTER TABLE "collection_normalized_floor_sell_events" ADD COLUMN "order_valid_from" TIMESTAMPTZ;
ALTER TABLE "collection_normalized_floor_sell_events" ADD COLUMN "order_valid_to" TIMESTAMPTZ;

ALTER TABLE "order_events" ADD COLUMN "order_valid_from" TIMESTAMPTZ;
ALTER TABLE "order_events" ADD COLUMN "order_valid_to" TIMESTAMPTZ;

ALTER TABLE "bid_events" ADD COLUMN "order_valid_from" TIMESTAMPTZ;
ALTER TABLE "bid_events" ADD COLUMN "order_valid_to" TIMESTAMPTZ;

ALTER TABLE "collection_top_bid_events" ADD COLUMN "order_valid_from" TIMESTAMPTZ;
ALTER TABLE "collection_top_bid_events" ADD COLUMN "order_valid_to" TIMESTAMPTZ;

ALTER TABLE "collection_non_flagged_floor_sell_events" ADD COLUMN "order_valid_from" TIMESTAMPTZ;
ALTER TABLE "collection_non_flagged_floor_sell_events" ADD COLUMN "order_valid_to" TIMESTAMPTZ;

-- Down Migration

ALTER TABLE "orders" DROP COLUMN "valid_from";
ALTER TABLE "orders" DROP COLUMN "valid_to";

ALTER TABLE "collections" DROP COLUMN "floor_sell_valid_from";
ALTER TABLE "collections" DROP COLUMN "floor_sell_valid_to";

ALTER TABLE "collections" DROP COLUMN "normalized_floor_sell_valid_from";
ALTER TABLE "collections" DROP COLUMN "normalized_floor_sell_valid_to";

ALTER TABLE "collections" DROP COLUMN "top_buy_valid_from";
ALTER TABLE "collections" DROP COLUMN "top_buy_valid_to";

ALTER TABLE "collections" DROP COLUMN "non_flagged_floor_sell_valid_from";
ALTER TABLE "collections" DROP COLUMN "non_flagged_floor_sell_valid_to";

ALTER TABLE "token_floor_sell_events" DROP COLUMN "valid_from";
ALTER TABLE "token_floor_sell_events" DROP COLUMN "valid_to";

ALTER TABLE "token_normalized_floor_sell_events" DROP COLUMN "valid_from";
ALTER TABLE "token_normalized_floor_sell_events" DROP COLUMN "valid_to";

ALTER TABLE "collection_floor_sell_events" DROP COLUMN "order_valid_from";
ALTER TABLE "collection_floor_sell_events" DROP COLUMN "order_valid_to";

ALTER TABLE "collection_normalized_floor_sell_events" DROP COLUMN "order_valid_from";
ALTER TABLE "collection_normalized_floor_sell_events" DROP COLUMN "order_valid_to";

ALTER TABLE "order_events" DROP COLUMN "order_valid_from";
ALTER TABLE "order_events" DROP COLUMN "order_valid_to";

ALTER TABLE "bid_events" DROP COLUMN "order_valid_from";
ALTER TABLE "bid_events" DROP COLUMN "order_valid_to";

ALTER TABLE "collection_top_bid_events" DROP COLUMN "order_valid_from";
ALTER TABLE "collection_top_bid_events" DROP COLUMN "order_valid_to";

ALTER TABLE "collection_non_flagged_floor_sell_events" DROP COLUMN "order_valid_from";
ALTER TABLE "collection_non_flagged_floor_sell_events" DROP COLUMN "order_valid_to";