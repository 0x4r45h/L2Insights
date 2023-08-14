import { ethers } from 'ethers';
import { TransactionRequest } from 'ethers/src.ts/providers/provider';
import { GasOracle } from './GasOracleFactory';
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
    const gasToUse = await this.ethersProvider.provider.estimateGas(tx);
    if (!tx.gasPrice) {
      throw new Error('There was an error estimating L2 fee');
    }
    return gasToUse * BigInt(tx.gasPrice);
  }
}
