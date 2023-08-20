import { ethers } from 'ethers';
import { TransactionFees } from './GasOracleFactory';
import { MetaMaskTransaction } from './utils';

export abstract class BaseGasOracle {
  protected abstract oracleABI: string[];

  protected ethersProvider = new ethers.BrowserProvider(ethereum);

  protected abstract oracleContract: ethers.Contract;

  protected _tx: MetaMaskTransaction;

  constructor(tx: MetaMaskTransaction) {
    this._tx = tx;
  }

  abstract RLPEncode(): Promise<string>;

  async getL1Fee(): Promise<bigint> {
    const l1Fee = await this.oracleContract.getL1Fee(await this.RLPEncode());
    // Because we use fake signer and fake nonce, increase the fee by 5% to be safe
    return (l1Fee * 105n) / 100n;
  }

  abstract getL2Fee(): Promise<bigint>;

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
    finalFees.L2fee = await this.getL2Fee();
    try {
      await this.ethersProvider.provider.estimateGas(this._tx);
      finalFees.IsSuccessful = true;
      return finalFees;
    } catch (e) {
      finalFees.IsSuccessful = false;
      // TODO : make sure error is related to gas calculation, otherwise throw error as it is
      if (BigInt(this._tx.value) === 0n || this._tx.data !== '0x') {
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
