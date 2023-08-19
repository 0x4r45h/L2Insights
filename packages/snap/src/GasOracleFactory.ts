import { ScrollAlphaOracle } from './ScrollAlphaOracle';
import { ScrollSepoliaOracle } from './ScrollSepoliaOracle';
import { BaseGasOracle } from './AbstractOracle';

export type TransactionFees = {
  L1fee: bigint;
  L2fee: bigint;
  TotalFee: bigint;
  IsSuccessful: boolean;
  SendingMaxEth: boolean;
};

/**
 * Return corresponding strategy based on given chain id.
 *
 * @param chainId - The CAIP-2 chain ID of the network.
 * @returns A strategy implementing GasOracle interface.
 */
export function getOracle(chainId: string): BaseGasOracle {
  if (chainId === 'eip155:82751') {
    return new ScrollAlphaOracle();
  }

  if (chainId === 'eip155:8274f') {
    return new ScrollSepoliaOracle();
  }
  throw new Error('Oracle is not present for this chain id');
}
