import type { OnTransactionHandler } from '@metamask/snaps-types';
import { copyable, divider, heading, panel, text } from '@metamask/snaps-ui';

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
  const totalFee = await oracle.estimateTotalFee(transaction, l1Fee);
  let errors: any[] = [];
  let header: any[] = [];
  if (!totalFee.IsSuccessful) {
    header = [heading('TRANSACTION WILL FAIL!'), divider()];
    errors = [
      divider(),
      text(
        'The maximum ether can be sent is shown below. if you proceed with current value this transaction will fail!',
      ),
      copyable(`${formatEther(totalFee.MaxValue)}`),
    ];
  }
  return {
    content: panel([
      ...header,
      text('**L1 Gas:**'),
      text(l1GasUsed.toString()),
      divider(),
      text('**L1 Gas Fee:**'),
      text(`${formatEther(l1Fee)} ETH`),
      divider(),
      text('**L2 Gas Fee:**'),
      text(`${formatEther(totalFee.L2fee)} ETH`),
      divider(),
      text('**Total Fee:**'),
      text(`${formatEther(totalFee.TotalFee)} ETH`),
      ...errors,
    ]),
  };
};
