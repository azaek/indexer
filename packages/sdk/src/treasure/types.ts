//orderparams for treasure
export type OrderParams = {
  maker: string;
  nftAddress: string; // address
  tokenId: string; // uint256
  quantity: string; // uint64
  pricePerItem: string; // uint128
  expirationTime: number; // uint64
  paymentToken: string; // address
};
