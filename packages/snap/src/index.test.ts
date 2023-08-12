import { expect } from '@jest/globals';
import { installSnap } from '@metamask/snaps-jest';
import { panel, text } from '@metamask/snaps-ui';

describe('onTransaction', () => {
  it('return No insights for unsupported chain id', async () => {
    const { sendTransaction, close } = await installSnap();

    const response = await sendTransaction({
      chainId: 'eip155:1',
    });

    expect(response).toRender(panel([text('No insights for this ChainID')]));

    await close();
  });
});
// TODO : add more tests
