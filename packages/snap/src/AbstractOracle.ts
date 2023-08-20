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
      SendingMaxValue: false,
      L1fee: l1fee,
      L2fee: 0n,
      IsSuccessful: false,
      Shortfall: 0n,
      get TotalFee() {
        return this.L1fee + this.L2fee;
      },
    };
    finalFees.L2fee = await this.getL2Fee();
    const balance = await this.ethersProvider.getBalance(this._tx.from);
    const totalSpendingEth = finalFees.TotalFee + BigInt(this._tx.value);
    if (totalSpendingEth < balance) {
      finalFees.IsSuccessful = true;
      return finalFees;
    }
    finalFees.IsSuccessful = false;
    finalFees.Shortfall = totalSpendingEth - balance + 1n;
    if (BigInt(this._tx.value) > 0n || this._tx.data === '0x') {
      // so user is sending maximum possible value out of account
      finalFees.SendingMaxValue = true;
    }
    return finalFees;
  }
}
