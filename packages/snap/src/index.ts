import type { OnTransactionHandler } from '@metamask/snaps-types';
import { divider, panel, text } from '@metamask/snaps-ui';

import { formatEther } from 'ethers';
import { getOracle } from './GasOracleFactory';

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
  const oracle = getOracle(chainId);
  const serialized = oracle.RLPEncode(transaction);
  const l1GasUsed = await oracle.getL1Gas(serialized);
  const l1Fee = await oracle.getL1Fee(serialized);
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
