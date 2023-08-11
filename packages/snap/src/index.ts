import type { OnTransactionHandler } from '@metamask/snaps-types';
import { divider, panel, text } from '@metamask/snaps-ui';

import { ethers, formatEther } from 'ethers';
import { serializeLegacyTx } from './utils';

const scrollOracleAbi = [
  'function overhead() external view returns (uint256)',
  'function scalar() external view returns (uint256)',
  'function l1BaseFee() external view returns (uint256)',
  'function getL1Fee(bytes memory data) external view returns (uint256)',
  'function getL1GasUsed(bytes memory data) external view returns (uint256)',
];
const ethersProvider = new ethers.BrowserProvider(ethereum);
const scrollOracle = new ethers.Contract(
  '0x5300000000000000000000000000000000000002',
  scrollOracleAbi,
  ethersProvider,
);

/**
 * Handle incoming transactions, sent through the `wallet_sendTransaction`
 * method. This handler decodes the transaction data, and displays the type of
 * transaction in the transaction insights panel.
 *
 * The `onTransaction` handler is different from the `onRpcRequest` handler in
 * that it is called by MetaMask when a transaction is initiated, rather than
 * when a dapp sends a JSON-RPC request. The handler is called before the
 * transaction is signed, so it can be used to display information about the
 * transaction to the user before they sign it.
 *
 * The `onTransaction` handler returns a Snaps UI component, which is displayed
 * in the transaction insights panel.
 *
 * @param args - The request parameters.
 * @param args.transaction - The transaction object. This contains the
 * transaction parameters, such as the `from`, `to`, `value`, and `data` fields.
 * @param args.chainId - The CAIP-2 chain ID of the network.
 * @returns The transaction insights.
 */
export const onTransaction: OnTransactionHandler = async ({
  transaction,
  chainId,
}) => {
  if (chainId !== 'eip155:82751') {
    return {
      content: panel([text('No insights for this ChainID')]),
    };
  }
  const serialized = serializeLegacyTx(transaction);
  const l1GasUsed = await getL1GasUsed(serialized);
  const l1Fee = await getL1Fee(serialized);
  return {
    content: panel([
      text('**L1 Gas count:**'),
      text(l1GasUsed.toString()),
      divider(),
      text('**L1 Gas Fee:**'),
      text(`${l1Fee.toString()} or in eth ${formatEther(l1Fee).toString()}`),
    ]),
  };
};

/**
 * Query the oracle for estimation around L1 Gas based on given transaction.
 *
 * @param tx - RLP encoded transaction payload.
 * @returns Estimated gas in wei.
 */
async function getL1GasUsed(tx: string): Promise<bigint> {
  return await scrollOracle.getL1GasUsed(tx);
}

/**
 * Query the oracle for estimation around L1 Fee based on given transaction.
 *
 * @param tx - RLP encoded transaction payload.
 * @returns Estimated fee in wei.
 */
async function getL1Fee(tx: string): Promise<bigint> {
  return await scrollOracle.getL1Fee(tx);
}
