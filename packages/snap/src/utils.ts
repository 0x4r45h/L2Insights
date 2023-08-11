import { Transaction } from 'ethers/lib.esm';

/**
 * Serialize transaction to be sent to scroll oracles to calculate the gas. the nonce
 * is not valid because it doesn't make noticeable difference in calculations.
 *
 * @param transaction - The transaction data from OnTransactionHandler.
 * @returns Unsigned RLP encoded transaction with constant nonce.
 */
export function serializeLegacyTx(transaction: { [key: string]: any }) {
  const tx = new Transaction();
  tx.data = transaction.data ?? '0x';
  tx.to = transaction.to;
  tx.gasPrice = transaction.gasPrice;
  tx.gasLimit = transaction.gas;
  tx.value = transaction.value;
  tx.nonce = 0x0;
  return tx.unsignedSerialized;
}
