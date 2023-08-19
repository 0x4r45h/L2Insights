import { ethers, Transaction } from 'ethers';
import { TransactionRequest } from 'ethers/src.ts/providers/provider';
import { TransactionLike } from 'ethers/src.ts/transaction/transaction';
import { GasOracle, TransactionFees } from './GasOracleFactory';

export class ScrollAlphaOracle implements GasOracle {
  private scrollOracleAbi = [
    'function overhead() external view returns (uint256)',
    'function scalar() external view returns (uint256)',
    'function l1BaseFee() external view returns (uint256)',
    'function getL1Fee(bytes memory data) external view returns (uint256)',
    'function getL1GasUsed(bytes memory data) external view returns (uint256)',
  ];

  private ethersProvider = new ethers.BrowserProvider(ethereum);

  private scrollOracle = new ethers.Contract(
    '0x5300000000000000000000000000000000000002',
    this.scrollOracleAbi,
    this.ethersProvider,
  );

  async getL1Fee(RLPEncodedTx: string): Promise<bigint> {
    const l1Fee = await this.scrollOracle.getL1Fee(RLPEncodedTx);
    // Because we use fake nonce, increase the fee by 5% to be safe
    return (l1Fee * 105n) / 100n;
  }

  async getL1Gas(RLPEncodedTx: string): Promise<bigint> {
    return await this.scrollOracle.getL1GasUsed(RLPEncodedTx);
  }

  async RLPEncode(tx: TransactionLike): Promise<string> {
    const { from, ...rest } = tx;
    const newTx = Transaction.from(rest);
    // TODO : investigate why using type Eip2930 tx works better to estimate L1 gasFee on Scroll Alpha
    newTx.type = 'berlin';
    return newTx.unsignedSerialized;
  }

  async estimateL2Fee(tx: TransactionRequest): Promise<bigint> {
    try {
      const gasToUse = await this.ethersProvider.provider.estimateGas(tx);
      if (!tx.gasPrice) {
        throw new Error('There was an error estimating L2 fee');
      }
      return gasToUse * BigInt(tx.gasPrice);
    } catch (e) {
      console.log('error in gas estimate', e);
      return 0n;
    }
  }

  async estimateTotalFee(
    transaction: TransactionRequest,
    l1fee: bigint,
  ): Promise<TransactionFees> {
    // if (!tx.gasPrice) {
    //   throw new Error('Cannot estimate gas without proposed GasPrice');
    // }
    const finalFees: TransactionFees = {
      SendingMaxEth: false,
      L1fee: l1fee,
      L2fee: 0n,
      IsSuccessful: false,
      get TotalFee() {
        console.log(`type of l1 fee`, typeof this.L1fee);
        console.log(`type of l2 fee`, typeof this.L2fee);
        return (this.L1fee as bigint) + (this.L2fee as bigint);
      },
    };
    finalFees.L2fee =
      BigInt(transaction.gasPrice as bigint) *
      BigInt(transaction.gasLimit as bigint);
    console.log('l1 fee is ', l1fee);
    try {
      await this.ethersProvider.provider.estimateGas(transaction);
      finalFees.IsSuccessful = true;
      return finalFees;
    } catch (e) {
      finalFees.IsSuccessful = false;
      console.log(e);
      // TODO : make sure error is related to gas calculation, otherwise throw error as it is
      if (
        (transaction.value && (transaction.value as bigint) === 0n) ||
        (transaction.data && transaction.data !== '0x0')
      ) {
        // so user is executing arbitrary codes
        return finalFees;
      }
      finalFees.SendingMaxEth = true;
      // Here we try to subtract L1 fee from total value to estimate the gas
      const expectedTx = { ...transaction };
      expectedTx.value = (expectedTx.value as bigint) - l1fee;
      console.log('final value', expectedTx.value);
      // Estimate gas again with modified value
      console.log('expected tx : ', expectedTx);
      // console.log(JSON.stringify(expectedTx));
      await this.ethersProvider.provider.estimateGas(expectedTx);
      return finalFees;
    }
  }
}
