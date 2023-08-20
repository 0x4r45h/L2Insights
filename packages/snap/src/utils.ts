import { TransactionLike } from 'ethers/src.ts/transaction/transaction';
import { BigNumberish } from 'ethers';

export type MetaMaskTransaction = TransactionLike<string> & {
  from: string;
  to: string;
  value: BigNumberish;
  gasLimit: BigNumberish;
  // gasPrice: BigNumberish;
  data: string;
};

export enum L2ChainID {
  SCROLL_ALPHA = 534353,
  SCROLL_SEPOLIA = 534351,
  OPTIMISM = 10,
  OPTIMISM_GOERLI = 420,
  BASE_GOERLI = 84531,
  BASE = 8453,
}

/**
 * Check if given chain id matches our supported chains.
 *
 * @param chainId - Integer chain id.
 * @returns True on supported chains.
 */
export function isChainIdSupported(chainId: number): boolean {
  return Object.values(L2ChainID).includes(chainId);
}
