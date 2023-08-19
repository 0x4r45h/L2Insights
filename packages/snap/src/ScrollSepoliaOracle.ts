import { ethers, Wallet } from 'ethers';
import { TransactionRequest } from 'ethers/src.ts/providers/provider';
import { TransactionLike } from 'ethers/src.ts/transaction/transaction';
import { GasOracle, TransactionFees } from './GasOracleFactory';

export class ScrollSepoliaOracle implements GasOracle {
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

  private unsafeSigner = Wallet.fromPhrase(
    'veteran daughter dog twelve trim remind crime figure brother brain helmet village',
    this.ethersProvider,
  );

  async getL1Fee(RLPEncodedTx: string): Promise<bigint> {
    const l1Fee = await this.scrollOracle.getL1Fee(RLPEncodedTx);
    // Because we use fake signer and nonce, increase the fee by 5% to be safe
    return (l1Fee * 105n) / 100n;
  }

  async getL1Gas(RLPEncodedTx: string): Promise<bigint> {
    return await this.scrollOracle.getL1GasUsed(RLPEncodedTx);
  }

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

  async estimateTotalFee(
    transaction: TransactionRequest,
    l1fee: bigint,
  ): Promise<TransactionFees> {

    const finalFees: TransactionFees = {
      SendingMaxEth: false,
      L1fee: l1fee,
      L2fee: 0n,
      IsSuccessful: false,
      get TotalFee() {
        return this.L1fee + this.L2fee;
      },
    };
    finalFees.L2fee =
      BigInt(transaction.gasPrice as bigint) *
      BigInt(transaction.gasLimit as bigint);
    try {
      await this.ethersProvider.provider.estimateGas(transaction);
      finalFees.IsSuccessful = true;
      return finalFees;
    } catch (e) {
      finalFees.IsSuccessful = false;
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
      // Estimate gas again with modified value
      await this.ethersProvider.provider.estimateGas(expectedTx);
      return finalFees;
    }
  }
}
