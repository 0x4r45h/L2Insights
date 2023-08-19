import { TransactionLike } from 'ethers/src.ts/transaction/transaction';
import { BigNumberish } from 'ethers';

export type MetaMaskTransaction = TransactionLike<string> & {
  from: string;
  to: string;
  value: BigNumberish;
  gasLimit: BigNumberish;
  gasPrice: BigNumberish;
  data: string;
};
