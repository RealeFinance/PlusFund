# Public deployment registry

This file is the public deployment address book. It records deployed proxies, implementation releases, and known Timelock associations in one table. Safe addresses, deployment transactions and blocks, supported-token parameters, and operational notes remain in the private deployment registry.

## Structure and version notes

- **Legacy / stoken1.0** uses the `_tokenList` and `_tokenMap` storage model. These deployments are not direct upgrade targets for the Wallet/mainline implementation.
- **Wallet / main** uses the Wallet mapping family.
- The current `main` source reports version `2.1.3`. Implementation/version cells for proxies are populated only after the current implementation is verified on-chain. A released implementation address alone does not mean existing proxies use that version.
- Record each future implementation release and each verified proxy-to-implementation association in the same table. For proxy rows, verify the implementation from the deployment event or current on-chain implementation slot; note the Timelock only when known.

## Deployment addresses

| Product | Network | Structure | Proxy address | Implementation (version/address) | Timelock |
| --- | --- | --- | --- | --- | --- |
| PlusFund implementation | BSC mainnet | Wallet / main | — | 2.1.3: [`0x69e75600235F031449490E1A567EF74835339Ce1`](https://bscscan.com/address/0x69e75600235F031449490E1A567EF74835339Ce1) | — |
| PlusFund implementation | Ethereum mainnet | Wallet / main | — | 2.1.3: [`0xD8E75f2DFFb3F708E2326b0a256818375fa3920a`](https://etherscan.io/address/0xD8E75f2DFFb3F708E2326b0a256818375fa3920a) | — |
| PlusFund implementation | ARC | Wallet / main | — | 2.1.3 verified: `0xdc0838197aA0de07FB8218D22F691D3f5B23ca53` | — |
| Cash+ | HashKey testnet | Legacy / stoken1.0 | `0x40fc7a4Dfcade4021946f028f6fCf43666110847` | — | — |
| Cash+ | BSC testnet | Legacy / stoken1.0 | [`0x4013361546efe989Efd4a1242aDD5Ea88915e980`](https://testnet.bscscan.com/address/0x4013361546efe989Efd4a1242aDD5Ea88915e980) | — | — |
| Cash+ | BSC mainnet | Legacy / stoken1.0 | [`0x1775504c5873e179Ea2f8ABFcE3861EC74D159bc`](https://bscscan.com/address/0x1775504c5873e179Ea2f8ABFcE3861EC74D159bc) | — | — |
| Cash+ | Ethereum mainnet | Legacy / stoken1.0 | [`0x498D9329555471bF6073A5f2D047F746d522A373`](https://etherscan.io/address/0x498D9329555471bF6073A5f2D047F746d522A373) | — | — |
| Cash+ | Ethereum Sepolia | Legacy / stoken1.0 | [`0x734bb43B503Ea50EBE58EB371e34263551cc3d28`](https://sepolia.etherscan.io/address/0x734bb43B503Ea50EBE58EB371e34263551cc3d28) | — | — |
| Cash+ | Avalanche Fuji testnet | Legacy / stoken1.0 | `0x0D90a6eE85d5668734bb3A515147f53EBDfE866c` | — | — |
| Cash+ | Pharos private mainnet | Legacy / stoken1.0 | `0x0D90a6eE85d5668734bb3A515147f53EBDfE866c` | — | — |
| Bond+ | HashKey mainnet | Legacy / stoken1.0 | `0x0D90a6eE85d5668734bb3A515147f53EBDfE866c` | — | — |
| Bond+ | Avalanche mainnet | Legacy / stoken1.0 | `0x0D90a6eE85d5668734bb3A515147f53EBDfE866c` | — | — |
| Bond+ | BSC mainnet | Legacy / stoken1.0 | `0xef663399110a76B3668e97fe697d721DCBb0c316` | — | — |
| Bond+ | Pharos private mainnet | Legacy / stoken1.0 | `0xCd01A9197c71d844A2AFCEd2D2fD7102FBB3Fa83` | — | — |
| AMCASH | BSC mainnet | Legacy / stoken1.0 | [`0x0ba0443A7a2D4Bfeb44ec5C1234106CBc2557A91`](https://bscscan.com/address/0x0ba0443A7a2D4Bfeb44ec5C1234106CBc2557A91) | — | — |
| AMCASH | Ethereum mainnet | Legacy / stoken1.0 | [`0x212624EE086bF0A8393F3BE84F4e21f54372F8AF`](https://etherscan.io/address/0x212624EE086bF0A8393F3BE84F4e21f54372F8AF) | — | — |
| AMCASH+ | BSC mainnet | Legacy / stoken1.0 | [`0x1ec3AA07e3898f1e6d4F23b5dce1bdbecb5c1Fe1`](https://bscscan.com/address/0x1ec3AA07e3898f1e6d4F23b5dce1bdbecb5c1Fe1) | — | — |
| AMCASH+ | Ethereum mainnet | Legacy / stoken1.0 | [`0x78e80dA0616887b46A31F39310C2a8B0Fbd6A42d`](https://etherscan.io/address/0x78e80dA0616887b46A31F39310C2a8B0Fbd6A42d) | — | — |
| Cash+ 2.0 | BSC testnet | Wallet / main | [`0x9EA9cd205783F08700d2A12C325FC4e1BF8e99a2`](https://testnet.bscscan.com/address/0x9EA9cd205783F08700d2A12C325FC4e1BF8e99a2) | — | — |
| Cash+ 2.0 | Ethereum Sepolia | Wallet / main | [`0xbc0E5Af03b41FEB5ec5968Ddd324f3eC48017138`](https://sepolia.etherscan.io/address/0xbc0E5Af03b41FEB5ec5968Ddd324f3eC48017138) | — | — |
| Cash+ 2.0 | Pharos mainnet | Wallet / main | [`0x907C00D587DaFf16D028fE1e131d6DD3c6BF2F4B`](https://pharos.socialscan.io/address/0x907C00D587DaFf16D028fE1e131d6DD3c6BF2F4B) | — | — |
| Cash+ 2.0 | Pharos Atlantic testnet | Wallet / main | [`0x4013361546efe989Efd4a1242aDD5Ea88915e980`](https://atlantic.pharos.io/address/0x4013361546efe989Efd4a1242aDD5Ea88915e980) | — | — |
| Bond+ 2.0 | Pharos mainnet | Wallet / main | [`0x286D9F099587f567EcE2b70eBB64B94ACD672d76`](https://pharos.socialscan.io/address/0x286D9F099587f567EcE2b70eBB64B94ACD672d76) | — | — |
| Bond+ 2.0 | Plume mainnet | Wallet / main | [`0x0D90a6eE85d5668734bb3A515147f53EBDfE866c`](https://explorer.plume.org/address/0x0D90a6eE85d5668734bb3A515147f53EBDfE866c) | — | — |
| Bond+ 2.0 | Ethereum mainnet | Wallet / main | [`0x28d77ea7c61cd9055983ef8b0806778d8bb12c88`](https://etherscan.io/address/0x28d77ea7c61cd9055983ef8b0806778d8bb12c88) | — | — |
| YIELD+ 2.0 | Pharos mainnet | Wallet / main | [`0x87a1A531090bc58b34398E3cBa4C9b00c6B9231E`](https://pharos.socialscan.io/address/0x87a1A531090bc58b34398E3cBa4C9b00c6B9231E) | — | — |
| YIELD+ 2.0 | Plume mainnet | Wallet / main | [`0xD9ffec462793e6627F223671E9C9b217C8103940`](https://explorer.plume.org/address/0xD9ffec462793e6627F223671E9C9b217C8103940) | — | — |
| YIELD+ 2.0 | Ethereum mainnet | Wallet / main | [`0x37d03D8caBfB617e455D0cAA0Cf1cdc5b8F3BDEe`](https://etherscan.io/address/0x37d03D8caBfB617e455D0cAA0Cf1cdc5b8F3BDEe) | — | — |
| YIELD+ 2.0 | BSC mainnet | Wallet / main | [`0xCCa4656F736490cf2155589aEcd8382765a3e691`](https://bscscan.com/address/0xCCa4656F736490cf2155589aEcd8382765a3e691) | — | — |
| NGI+ 2.0 | Pharos mainnet | Wallet / main | [`0x85f51213A6c3F2566aF519D296BB75AD4EC6d234`](https://pharos.socialscan.io/address/0x85f51213A6c3F2566aF519D296BB75AD4EC6d234) | — | — |
| NGI+ 2.0 | Ethereum mainnet | Wallet / main | [`0xF252C5BD43907a6CAb079E990845a37a7C5730d9`](https://etherscan.io/address/0xF252C5BD43907a6CAb079E990845a37a7C5730d9) | — | — |
| NGI+ 2.0 | BSC mainnet | Wallet / main | [`0x50BF2924ceE59737EAD76e881643eD8569BAe6e8`](https://bscscan.com/address/0x50BF2924ceE59737EAD76e881643eD8569BAe6e8) | — | — |
| PGNGI+ 2.0 | Pharos mainnet | Wallet / main | [`0x238Bd29Bc460F6cB56f80f99B2B39Ff2c183Ee4D`](https://pharos.socialscan.io/address/0x238Bd29Bc460F6cB56f80f99B2B39Ff2c183Ee4D) | — | — |
| PGNGI+ 2.0 | Ethereum mainnet | Wallet / main | [`0x0e6fcE64D9e32ebF5D7cf3f6DEd501415EcA374c`](https://etherscan.io/address/0x0e6fcE64D9e32ebF5D7cf3f6DEd501415EcA374c) | — | [`0x6FbCbE620ca30E16f74717192E2BE8Ba578B8FDD`](https://etherscan.io/address/0x6FbCbE620ca30E16f74717192E2BE8Ba578B8FDD) |
| PGNGI+ 2.0 | BSC mainnet | Wallet / main | [`0x9d54F56e71923eBd0c61336916f91CFb3a3938C3`](https://bscscan.com/address/0x9d54F56e71923eBd0c61336916f91CFb3a3938C3) | — | — |
| PGNGI+ 2.0 | Arc | Wallet / main | `0x0D90a6eE85d5668734bb3A515147f53EBDfE866c` | — | `0x4013361546efe989Efd4a1242aDD5Ea88915e980` |
| EPOCH+ 2.0 | Ethereum mainnet | Wallet / main | [`0x3bE5dD4a34F1C6a112048b9dF908cED4372D5049`](https://etherscan.io/address/0x3bE5dD4a34F1C6a112048b9dF908cED4372D5049) | — | — |
| CASHa+ 2.0 | Ethereum mainnet | Wallet / main | [`0x907C00D587DaFf16D028fE1e131d6DD3c6BF2F4B`](https://etherscan.io/address/0x907C00D587DaFf16D028fE1e131d6DD3c6BF2F4B) | — | — |
| CNCASH+ 2.0 | Ethereum mainnet | Wallet / main | [`0x286D9F099587f567EcE2b70eBB64B94ACD672d76`](https://etherscan.io/address/0x286D9F099587f567EcE2b70eBB64B94ACD672d76) | — | — |
| GTCASH+ 3.0 | Ethereum mainnet | Wallet / main | [`0x63E19Fb814Eb737730ac0aFbb52B351695B97176`](https://etherscan.io/address/0x63E19Fb814Eb737730ac0aFbb52B351695B97176) | — | — |
| HTCASH+ 3.0 | Ethereum mainnet | Wallet / main | [`0x50bDAFf4bCeB852F006F657f47C68fCC417f7bEb`](https://etherscan.io/address/0x50bDAFf4bCeB852F006F657f47C68fCC417f7bEb) | — | — |
| mYIELD+ 3.0 | BSC mainnet | Wallet / main | [`0xFb8cB7630BC3cb34a6A9846Ec03De3A32393Ee65`](https://bscscan.com/address/0xFb8cB7630BC3cb34a6A9846Ec03De3A32393Ee65) | — | — |
| mYIELD+ 3.0 | Ethereum mainnet | Wallet / main | [`0xf3a2a5de306b063D75C86B6352832639b7263a3B`](https://etherscan.io/address/0xf3a2a5de306b063D75C86B6352832639b7263a3B) | — | — |
| GFCASH+ 3.0 | Ethereum mainnet | Wallet / main | [`0x46c8055eD9D3c7DF3f515EE6Cd4a5b8616156719`](https://etherscan.io/address/0x46c8055eD9D3c7DF3f515EE6Cd4a5b8616156719) | — | — |
| TKCASH+ 3.0 | Ethereum mainnet | Wallet / main | [`0x257c71ecDB944EC09780c97e874ED41e98E00913`](https://etherscan.io/address/0x257c71ecDB944EC09780c97e874ED41e98E00913) | — | — |
