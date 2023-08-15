import { ethers } from 'ethers';
import { TransactionRequest } from 'ethers/src.ts/providers/provider';
import { GasOracle, TransactionFees } from './GasOracleFactory';
import { serializeLegacyTx } from './utils';

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
    return await this.scrollOracle.getL1Fee(RLPEncodedTx);
  }

  async getL1Gas(RLPEncodedTx: string): Promise<bigint> {
    return await this.scrollOracle.getL1GasUsed(RLPEncodedTx);
  }

  RLPEncode(tx: TransactionRequest): string {
    return serializeLegacyTx(tx);
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
    tx: TransactionRequest,
    l1fee: bigint,
  ): Promise<TransactionFees> {
    if (!tx.gasPrice) {
      throw new Error('Cannot estimate gas without proposed GasPrice');
    }
    const finalFees: TransactionFees = {
      L1fee: l1fee,
      L2fee: 0n,
      MaxValue: 0n,
      IsSuccessful: false,
      get TotalFee() {
        return this.L1fee + this.L2fee;
      },
    };
    try {
      const gasToUse = await this.ethersProvider.provider.estimateGas(tx);
      finalFees.L2fee = gasToUse * BigInt(tx.gasPrice);
      finalFees.IsSuccessful = true;
      return finalFees;
    } catch (e) {
      if (!tx.value) {
        console.log(e);
        throw new Error('Cannot estimate transaction fees');
      }
      // Here we try to subtract L1 fee from total value to estimate the gas
      const expectedTx = tx;
      expectedTx.value = BigInt(tx.value) - l1fee;
      // Estimate gas again with modified value
      const gasToUse = await this.ethersProvider.provider.estimateGas(
        expectedTx,
      );
      finalFees.L2fee = gasToUse * BigInt(tx.gasPrice);
      finalFees.IsSuccessful = false;
      finalFees.MaxValue = expectedTx.value;
      return finalFees;
    }
  }
}
