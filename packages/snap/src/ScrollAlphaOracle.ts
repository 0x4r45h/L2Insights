import { Transaction } from 'ethers';
import { TransactionLike } from 'ethers/src.ts/transaction/transaction';
import { BaseGasOracle } from './AbstractOracle';

export class ScrollAlphaOracle extends BaseGasOracle {
  async RLPEncode(tx: TransactionLike): Promise<string> {
    const { from, ...rest } = tx;
    const newTx = Transaction.from(rest);
    // TODO : investigate why using type Eip2930 tx works better to estimate L1 gasFee on Scroll Alpha
    newTx.type = 'berlin';
    return newTx.unsignedSerialized;
  }
}
