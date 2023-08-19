import type { OnTransactionHandler } from '@metamask/snaps-types';
import { copyable, divider, heading, panel, text } from '@metamask/snaps-ui';
import { formatEther } from 'ethers';
import { hexToNumber } from '@metamask/utils';
import { getOracle } from './GasOracleFactory';
import { MetaMaskTransaction } from './utils';

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
  if (!['eip155:82751', 'eip155:8274f'].includes(chainId)) {
    return {
      content: panel([text('No insights for this ChainID')]),
    };
  }
  console.log(JSON.stringify(transaction));
  const { gas, gasPrice, type, value, from, to, data, ...transactionLike } =
    transaction;
  const tx: MetaMaskTransaction = {
    ...transactionLike,
    from: from as string,
    to: to as string,
    value: value ? (value as string) : '0x0',
    gasLimit: gas ? (gas as string) : '0x0',
    gasPrice: gasPrice ? (gasPrice as string) : '0x0',
    data: data ? (data as string) : '0x',
    ...(type ? { type: hexToNumber(type as string) } : {}),
  };
  const oracle = getOracle(tx, chainId);
  const l1GasUsed = await oracle.getL1Gas();
  const l1Fee = await oracle.getL1Fee();

  const totalFee = await oracle.estimateTotalFee(l1Fee);
  let errors: any[] = [];
  let header: any[] = [];
  if (!totalFee.IsSuccessful) {
    header = [heading('TRANSACTION WILL FAIL!'), divider()];
    if (totalFee.SendingMaxEth) {
      errors = [
        divider(),
        text(
          'The maximum ether can be sent is shown below. if you proceed with current value this transaction will fail!',
        ),
        copyable(`${formatEther((tx.value as bigint) - totalFee.L1fee)}`),
      ];
    } else {
      errors = [
        divider(),
        text(
          'This transaction requires a minimum amount of Ether as indicated below, otherwise transaction will fail!',
        ),
        copyable(`${formatEther(totalFee.L1fee)}`),
      ];
    }
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
