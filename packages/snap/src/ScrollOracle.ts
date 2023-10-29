import { ethers, Wallet } from 'ethers';
import { BaseGasOracle } from './AbstractOracle';

export class ScrollOracle extends BaseGasOracle {
  protected oracleABI = [
    'function getL1Fee(bytes memory data) external view returns (uint256)',
    'function getL1GasUsed(bytes memory data) external view returns (uint256)',
  ];

  protected oracleContract = new ethers.Contract(
    '0x5300000000000000000000000000000000000002',
    this.oracleABI,
    this.ethersProvider,
  );

  private unsafeSigner = Wallet.fromPhrase(
    'veteran daughter dog twelve trim remind crime figure brother brain helmet village',
    this.ethersProvider,
  );

  async RLPEncode(): Promise<string> {
    const tempTx = { ...this._tx };
    // as we don't have access to user's keys, we use a fake signer instead
    tempTx.from = this.unsafeSigner.address;
    // Sometimes metamask can't detect type and returns null as type value
    // as we know scroll only supports legacy transactions, so we can safely
    // hard code it
    tempTx.type = 0;
    return await this.unsafeSigner.signTransaction(tempTx);
  }

  async getL2Fee(): Promise<bigint> {
    if (!this._tx.gasPrice) {
      throw new Error('gas price is empty');
    }
    return BigInt(this._tx.gasPrice) * BigInt(this._tx.gasLimit);
  }
}
