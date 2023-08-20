import { ethers, Transaction } from 'ethers';
import { BaseGasOracle } from './AbstractOracle';

export class OptimismChainsOracle extends BaseGasOracle {
  protected oracleABI = [
    'function getL1Fee(bytes memory _data) public view returns (uint256)',
    'function getL1GasUsed(bytes memory _data) public view returns (uint256)',
  ];

  protected oracleContract = new ethers.Contract(
    '0x420000000000000000000000000000000000000F',
    this.oracleABI,
    this.ethersProvider,
  );

  async RLPEncode(): Promise<string> {
    const { from, ...rest } = this._tx;
    const newTx = Transaction.from(rest);
    return newTx.unsignedSerialized;
  }

  async getL2Fee(): Promise<bigint> {
    if (!this._tx.maxFeePerGas) {
      throw new Error('max fee per gas is empty');
    }
    return BigInt(this._tx.maxFeePerGas) * BigInt(this._tx.gasLimit);
  }
}
