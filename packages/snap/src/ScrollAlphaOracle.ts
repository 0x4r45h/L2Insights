import { Transaction } from 'ethers';
import { BaseGasOracle } from './AbstractOracle';

export class ScrollAlphaOracle extends BaseGasOracle {
  async RLPEncode(): Promise<string> {
    const { from, ...rest } = this._tx;
    const newTx = Transaction.from(rest);
    // TODO : investigate why using type Eip2930 tx works better to estimate L1 gasFee on Scroll Alpha
    newTx.type = 'berlin';
    return newTx.unsignedSerialized;
  }
}
