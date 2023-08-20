import { ethers, Transaction } from 'ethers';
import { BaseGasOracle } from './AbstractOracle';

export class ScrollAlphaOracle extends BaseGasOracle {
  protected oracleABI = [
    'function getL1Fee(bytes memory data) external view returns (uint256)',
    'function getL1GasUsed(bytes memory data) external view returns (uint256)',
  ];

  protected oracleContract = new ethers.Contract(
    '0x5300000000000000000000000000000000000002',
    this.oracleABI,
    this.ethersProvider,
  );

  async RLPEncode(): Promise<string> {
    const { from, ...rest } = this._tx;
    const newTx = Transaction.from(rest);
    // TODO : investigate why using type Eip2930 tx works better to estimate L1 gasFee on Scroll Alpha
    newTx.type = 'berlin';
    return newTx.unsignedSerialized;
  }

  async getL2Fee(): Promise<bigint> {
    if (!this._tx.gasPrice) {
      throw new Error('gas price is empty');
    }
    return BigInt(this._tx.gasPrice) * BigInt(this._tx.gasLimit);
  }
}
