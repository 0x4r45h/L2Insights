import { ethers } from 'ethers';
import { TransactionFees } from './GasOracleFactory';
import { MetaMaskTransaction } from './utils';

export abstract class BaseGasOracle {
  private oracleABI = [
    'function getL1Fee(bytes memory data) external view returns (uint256)',
    'function getL1GasUsed(bytes memory data) external view returns (uint256)',
  ];

  protected ethersProvider = new ethers.BrowserProvider(ethereum);

  protected oracleContract = new ethers.Contract(
    '0x5300000000000000000000000000000000000002',
    this.oracleABI,
    this.ethersProvider,
  );

  protected _tx: MetaMaskTransaction;

  constructor(tx: MetaMaskTransaction) {
    this._tx = tx;
  }

  abstract RLPEncode(): Promise<string>;

  async getL1Fee(): Promise<bigint> {
    const l1Fee = await this.oracleContract.getL1Fee(await this.RLPEncode());
    // Because we use fake signer and nonce, increase the fee by 5% to be safe
    return (l1Fee * 105n) / 100n;
  }

  async getL1Gas(): Promise<bigint> {
    return await this.oracleContract.getL1GasUsed(await this.RLPEncode());
  }

  async estimateTotalFee(l1fee: bigint): Promise<TransactionFees> {
    const finalFees: TransactionFees = {
      SendingMaxEth: false,
      L1fee: l1fee,
      L2fee: 0n,
      IsSuccessful: false,
      get TotalFee() {
        return this.L1fee + this.L2fee;
      },
    };
    finalFees.L2fee = BigInt(this._tx.gasPrice) * BigInt(this._tx.gasLimit);
    try {
      await this.ethersProvider.provider.estimateGas(this._tx);
      finalFees.IsSuccessful = true;
      return finalFees;
    } catch (e) {
      finalFees.IsSuccessful = false;
      // TODO : make sure error is related to gas calculation, otherwise throw error as it is
      if (BigInt(this._tx.value) === 0n || this._tx.data !== '0x0') {
        // so user is executing arbitrary codes
        return finalFees;
      }
      // Otherwise user is trying to send MaxEth
      finalFees.SendingMaxEth = true;
      // Here we try to subtract L1 fee from total value to estimate the gas
      const expectedTx = { ...this._tx };
      expectedTx.value = BigInt(expectedTx.value) - l1fee;
      // Estimate gas again with modified value
      await this.ethersProvider.provider.estimateGas(expectedTx);
      return finalFees;
    }
  }
}
