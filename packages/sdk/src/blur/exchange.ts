import { Interface } from "@ethersproject/abi";
import { Provider } from "@ethersproject/abstract-provider";
import { Signer } from "@ethersproject/abstract-signer";
import { BigNumber, BigNumberish } from "@ethersproject/bignumber";
import { AddressZero, HashZero } from "@ethersproject/constants";
import { Contract, ContractTransaction } from "@ethersproject/contracts";

import * as CommonAddresses from "../common/addresses";
import * as RouterAddresses from "../router/v6/addresses";
import * as SeaportBase from "../seaport-base";
import * as SeaportV15 from "../seaport-v1.5";

import * as Addresses from "./addresses";
import { Order } from "./order";
import { TxData, getCurrentTimestamp, getRandomBytes } from "../utils";

import SeaportExchangeAbi from "../seaport-v1.5/abis/Exchange.json";
import ExchangeAbi from "./abis/Exchange.json";

export class Exchange {
  public chainId: number;
  public contract: Contract;

  constructor(chainId: number) {
    this.chainId = chainId;
    this.contract = new Contract(Addresses.Exchange[this.chainId], ExchangeAbi);
  }

  // --- Cancel order ---

  public async cancelOrder(maker: Signer, order: Order): Promise<ContractTransaction> {
    const tx = this.cancelOrderTx(await maker.getAddress(), order);
    return maker.sendTransaction(tx);
  }

  public cancelOrderTx(maker: string, order: Order): TxData {
    const data: string = this.contract.interface.encodeFunctionData("cancelOrder", [order.params]);
    return {
      from: maker,
      to: this.contract.address,
      data,
    };
  }

  // --- Get nonce ---

  public async getNonce(provider: Provider, user: string): Promise<BigNumber> {
    return this.contract.connect(provider).nonces(user);
  }

  // --- Increase nonce ---

  public async incrementHashNonce(maker: Signer): Promise<ContractTransaction> {
    const tx = this.incrementHashNonceTx(await maker.getAddress());
    return maker.sendTransaction(tx);
  }

  public incrementHashNonceTx(maker: string): TxData {
    const data: string = this.contract.interface.encodeFunctionData("incrementNonce", []);
    return {
      from: maker,
      to: this.contract.address,
      data,
    };
  }

  // --- Generate fee orders ---

  public async generateBlurFeeTradeDetails(taker: string, amount: BigNumberish, recipient: string) {
    const order = new SeaportV15.Order(this.chainId, {
      // To avoid format checking
      kind: "single-token",
      // We need an EIP1271-compliant contract that always returns success
      offerer: RouterAddresses.PaymentProcessorModule[this.chainId],
      zone: AddressZero,
      offer: [],
      consideration: [
        {
          itemType: SeaportBase.Types.ItemType.NATIVE,
          token: CommonAddresses.Eth[this.chainId],
          identifierOrCriteria: "0",
          startAmount: amount.toString(),
          endAmount: amount.toString(),
          recipient,
        },
      ],
      orderType: SeaportBase.Types.OrderType.FULL_OPEN,
      startTime: getCurrentTimestamp() - 60,
      endTime: getCurrentTimestamp() + 10 * 60,
      zoneHash: HashZero,
      salt: getRandomBytes(10).toString(),
      conduitKey: HashZero,
      counter: "0",
    });

    return {
      marketId: 10,
      value: amount.toString(),
      tradeData: new Interface(["function execute(bytes data)"]).encodeFunctionData("execute", [
        new Interface(SeaportExchangeAbi).encodeFunctionData("fulfillAvailableAdvancedOrders", [
          [
            {
              parameters: {
                ...order.params,
                totalOriginalConsiderationItems: order.params.consideration.length,
              },
              numerator: 1,
              denominator: 1,
              signature: "0x",
              extraData: "0x",
            },
          ],
          [],
          [],
          [
            [
              {
                orderIndex: 0,
                itemIndex: 0,
              },
            ],
          ],
          HashZero,
          taker,
          1,
        ]),
      ]),
    };
  }
}
