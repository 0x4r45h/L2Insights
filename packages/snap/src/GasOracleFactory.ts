import { TransactionRequest } from 'ethers/src.ts/providers/provider';
import { ScrollAlphaOracle } from './ScrollOracle';

export type GasOracle = {
  getL1Fee(tx: string): Promise<bigint>;
  getL1Gas(tx: string): Promise<bigint>;
  RLPEncode(tx: TransactionRequest): string;
  estimateL2Fee(tx: TransactionRequest): Promise<bigint>;
  estimateTotalFee(
    tx: TransactionRequest,
    l1fee: bigint,
  ): Promise<TransactionFees>;
};
export type TransactionFees = {
  L1fee: bigint;
  L2fee: bigint;
  TotalFee: bigint;
  IsSuccessful: boolean;
  MaxValue: bigint;
};

/**
 * Return corresponding strategy based on given chain id.
 *
 * @param chainId - The CAIP-2 chain ID of the network.
 * @returns A strategy implementing GasOracle interface.
 */
export function getOracle(chainId: string): GasOracle {
  if (chainId === 'eip155:82751') {
    return new ScrollAlphaOracle();
  }
  throw new Error('Oracle is not present for this chain id');
}
