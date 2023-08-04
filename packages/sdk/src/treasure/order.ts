import * as Types from "./types";
import { lc, n, s } from "../utils";

export class Order {
  public chainId: number;
  public params: Types.OrderParams;

  constructor(chainId: number, params: Types.OrderParams) {
    this.chainId = chainId;

    try {
      this.params = normalize(params);
    } catch {
      throw new Error("Invalid params");
    }
  }
}

const normalize = (order: Types.OrderParams): Types.OrderParams => {
  // Perform some normalization operations on the order:
  // - convert bignumbers to strings where needed
  // - convert strings to numbers where needed
  // - lowercase all strings

  return {
    maker: lc(order.maker), // address);
    nftAddress: lc(order.nftAddress), // address
    tokenId: s(order.tokenId), // uint256
    quantity: n(order.quantity), // uint64
    pricePerItem: s(order.pricePerItem), // uint128
    expirationTime: n(order.expirationTime), // uint64
    paymentToken: lc(order.paymentToken), // address
  };
};
