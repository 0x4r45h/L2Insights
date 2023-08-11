import { ScrollAlphaOracle } from './ScrollOracle';

export type GasOracle = {
  getL1Fee(tx: string): Promise<bigint>;
  getL1Gas(tx: string): Promise<bigint>;
  RLPEncode(tx: { [key: string]: any }): string;
};

export function getOracle(chainId: string): GasOracle {
  if (chainId === 'eip155:82751') {
    return new ScrollAlphaOracle();
  }
  throw new Error('Oracle is not present for this chain id');
}
