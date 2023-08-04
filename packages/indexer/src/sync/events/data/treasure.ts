import { Interface } from "@ethersproject/abi";
import { Treasure } from "@reservoir0x/sdk";

import { config } from "@/config/index";
import { EventData } from "@/events-sync/data";

export const itemSold: EventData = {
  kind: "treasure",
  subKind: "treasure-item-sold",
  addresses: { [Treasure.Addresses.Exchange[config.chainId]?.toLowerCase()]: true },
  topic: "0x72d3f914473a393354e6fcd9c3cb7d2eee53924b9b856f9da274e024566292a5",
  numTopics: 1,
  abi: new Interface([
    `event ItemSold(
      address seller, 
      address buyer, 
      address nftAddress, 
      uint256 tokenId, 
      uint64 quantity, 
      uint128 pricePerItem, 
      address paymentToken
    )`,
  ]),
};

export const bidAccepted: EventData = {
  kind: "treasure",
  subKind: "treasure-bid-accepted",
  addresses: { [Treasure.Addresses.Exchange[config.chainId]?.toLowerCase()]: true },
  topic: "0xf6b2b7813b1815a0e2e32964b4f22ec24862322d9c9c0e0eefac425dfc455ab1",
  numTopics: 1,
  abi: new Interface([
    `event BidAccepted(
      address seller, 
      address bidder, 
      address nftAddress, 
      uint256 tokenId, 
      uint64 quantity, 
      uint128 pricePerItem, 
      address paymentToken,
      uint8 bidType
    )`,
  ]),
};

export const itemListed: EventData = {
  kind: "treasure",
  subKind: "treasure-item-listed",
  addresses: { [Treasure.Addresses.Exchange[config.chainId]?.toLowerCase()]: true },
  topic: "0xb21f4a0122c6667aa16da06fcb7d9d3b2688164dfb40b7253aed80ea36d88e99",
  numTopics: 1,
  abi: new Interface([
    `event ItemListed(
      address seller, 
      address nftAddress, 
      uint256 tokenId, 
      uint64 quantity, 
      uint128 pricePerItem, 
      uint64 expirationTime,
      address paymentToken
    )`,
  ]),
};
