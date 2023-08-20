import { ScrollAlphaOracle } from './ScrollAlphaOracle';
import { ScrollSepoliaOracle } from './ScrollSepoliaOracle';
import { BaseGasOracle } from './AbstractOracle';
import { L2ChainID, MetaMaskTransaction } from './utils';
import { OptimismChainsOracle } from './OptimismChainsOracle';

export type TransactionFees = {
  L1fee: bigint;
  L2fee: bigint;
  TotalFee: bigint;
  IsSuccessful: boolean;
  SendingMaxValue: boolean;
  Shortfall: bigint;
};

/**
 * Return corresponding strategy based on given chain id.
 *
 * @param tx - Transaction object injected in snap.
 * @param chainId - The chain ID of the network.
 * @returns A strategy implementing GasOracle interface.
 */
export function getOracle(
  tx: MetaMaskTransaction,
  chainId: L2ChainID,
): BaseGasOracle {
  if (chainId === L2ChainID.SCROLL_ALPHA) {
    return new ScrollAlphaOracle(tx);
  }

  if (chainId === L2ChainID.SCROLL_SEPOLIA) {
    return new ScrollSepoliaOracle(tx);
  }

  if (
    [
      L2ChainID.OPTIMISM,
      L2ChainID.OPTIMISM_GOERLI,
      L2ChainID.BASE,
      L2ChainID.BASE_GOERLI,
    ].includes(chainId)
  ) {
    return new OptimismChainsOracle(tx);
  }
  throw new Error('Oracle is not present for this chain id');
}
