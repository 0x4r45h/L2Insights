import { Wallet } from 'ethers';
import { TransactionLike } from 'ethers/src.ts/transaction/transaction';
import { BaseGasOracle } from './AbstractOracle';

export class ScrollSepoliaOracle extends BaseGasOracle {
  private unsafeSigner = Wallet.fromPhrase(
    'veteran daughter dog twelve trim remind crime figure brother brain helmet village',
    this.ethersProvider,
  );

  async RLPEncode(tx: TransactionLike): Promise<string> {
    const tempTx = { ...tx };
    // as we don't have access to user's keys, we use a fake signer instead
    tempTx.from = this.unsafeSigner.address;
    // Sometimes metamask can't detect type and returns null as type value
    // as we know scroll only supports legacy transactions, so we can safely
    // hard code it
    tempTx.type = 0;
    return await this.unsafeSigner.signTransaction(tempTx);
  }
}
