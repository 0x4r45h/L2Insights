## Introduction

Most Ethereum layer 2 solutions come with two types of fees: the Layer 1 (L1) fee and the Layer 2 (L2) fee. Right now, MetaMask can only estimate L2 fees and doesn't consider L1 fees.
Interestingly, due to the high gas costs on Ethereum, the L1 data fee often ends up being the main contributor to the total transaction cost.
This situation can take many L2 users by surprise, leaving them feeling confused and frustrated when they end up paying more than they expected.
This MetaMask Snap (extension) provides a clear preview of the fees you'll face before you confirm your transaction.

#### Screenshots

<img src="https://github.com/0x4r45h/L2Insights/assets/19164358/1dde7d1e-644c-4899-bf9d-0b07429b145b" alt="metamask-lowEth" width="260" height="650">
<img src="https://github.com/0x4r45h/L2Insights/assets/19164358/42c609f0-6739-4728-a9ed-77086896c915" alt="metamask-normal-tx" width="260" height="650">
<img src="https://github.com/0x4r45h/L2Insights/assets/19164358/bad1229f-cf5e-436f-80b7-381cd1f25794" alt="metamask-maxEth" width="260" height="650">

#### Supported Chains

- Optimism
- Optimism Goerli
- Base
- Base Goerli
- Scroll Mainnet
- Scroll Sepolia Testnet
- Scroll Alpha Testnet

More chains to come!

## Getting Started

#### To use snap

[MetaMask Flask](https://metamask.io/flask/) is required.
You can install the latest version [Here](https://l2-insights-site.vercel.app/)

#### To build yourself

Clone this repository and setup the development environment:

```shell
yarn install && yarn start
```

### Testing and Linting

Run `yarn test` to run the tests once.

Run `yarn lint` to run the linter, or run `yarn lint:fix` to run the linter and fix any automatically fixable issues.

## Notes

- Babel is used for transpiling TypeScript to JavaScript, so when building with the CLI,
  `transpilationMode` must be set to `localOnly` (default) or `localAndDeps`.

### TODOs

- Write unit and integrated tests
- build and deploy to NPM automatically
