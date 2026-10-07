# Public deployment registry

This file intentionally contains only public deployment references:

- Product and network
- Deployed proxy address
- Contract structure family

Governance roles, Safe and Timelock addresses, deployment transactions and blocks, supported-token parameters, and operational notes are maintained in the private deployment registry.

## Structure labels

- **Legacy / stoken1.0**: Uses the `_tokenList` and `_tokenMap` storage model. These deployments are not direct upgrade targets for the Wallet/mainline implementation.
- **Wallet / main**: Uses the Wallet mapping family. Each proxy must be validated against its own upgrade path before an upgrade.

The current `main` source reports version `2.1.3`. This registry does not assert the live implementation version of each proxy. The 2026-09-30 on-chain audit snapshot in the maintenance report compared proxies against `2.1.2`; that validation has not yet been repeated against `2.1.3`.

## Legacy structure / stoken1.0

| Product | Network | Proxy address | Explorer |
| --- | --- | --- | --- |
| Cash+ | HashKey testnet | `0x40fc7a4Dfcade4021946f028f6fCf43666110847` | — |
| Cash+ | BSC testnet | `0x4013361546efe989Efd4a1242aDD5Ea88915e980` | [BscScan](https://testnet.bscscan.com/address/0x4013361546efe989Efd4a1242aDD5Ea88915e980) |
| Cash+ | BSC mainnet | `0x1775504c5873e179Ea2f8ABFcE3861EC74D159bc` | [BscScan](https://bscscan.com/address/0x1775504c5873e179Ea2f8ABFcE3861EC74D159bc) |
| Cash+ | Ethereum mainnet | `0x498D9329555471bF6073A5f2D047F746d522A373` | [Etherscan](https://etherscan.io/address/0x498D9329555471bF6073A5f2D047F746d522A373) |
| Cash+ | Ethereum Sepolia | `0x734bb43B503Ea50EBE58EB371e34263551cc3d28` | [Etherscan](https://sepolia.etherscan.io/address/0x734bb43B503Ea50EBE58EB371e34263551cc3d28) |
| Cash+ | Avalanche Fuji testnet | `0x0D90a6eE85d5668734bb3A515147f53EBDfE866c` | — |
| Cash+ | Pharos private mainnet | `0x0D90a6eE85d5668734bb3A515147f53EBDfE866c` | — |
| Bond+ | HashKey mainnet | `0x0D90a6eE85d5668734bb3A515147f53EBDfE866c` | — |
| Bond+ | Avalanche mainnet | `0x0D90a6eE85d5668734bb3A515147f53EBDfE866c` | — |
| Bond+ | BSC mainnet | `0xef663399110a76B3668e97fe697d721DCBb0c316` | — |
| Bond+ | Pharos private mainnet | `0xCd01A9197c71d844A2AFCEd2D2fD7102FBB3Fa83` | — |
| AMCASH | BSC mainnet | `0x0ba0443A7a2D4Bfeb44ec5C1234106CBc2557A91` | [BscScan](https://bscscan.com/address/0x0ba0443A7a2D4Bfeb44ec5C1234106CBc2557A91) |
| AMCASH | Ethereum mainnet | `0x212624EE086bF0A8393F3BE84F4e21f54372F8AF` | [Etherscan](https://etherscan.io/address/0x212624EE086bF0A8393F3BE84F4e21f54372F8AF) |
| AMCASH+ | BSC mainnet | `0x1ec3AA07e3898f1e6d4F23b5dce1bdbecb5c1Fe1` | [BscScan](https://bscscan.com/address/0x1ec3AA07e3898f1e6d4F23b5dce1bdbecb5c1Fe1) |
| AMCASH+ | Ethereum mainnet | `0x78e80dA0616887b46A31F39310C2a8B0Fbd6A42d` | [Etherscan](https://etherscan.io/address/0x78e80dA0616887b46A31F39310C2a8B0Fbd6A42d) |

## Wallet structure / main

| Product | Network | Proxy address | Explorer |
| --- | --- | --- | --- |
| Cash+ 2.0 | BSC testnet | `0x9EA9cd205783F08700d2A12C325FC4e1BF8e99a2` | [BscScan](https://testnet.bscscan.com/address/0x9EA9cd205783F08700d2A12C325FC4e1BF8e99a2) |
| Cash+ 2.0 | Ethereum Sepolia | `0xbc0E5Af03b41FEB5ec5968Ddd324f3eC48017138` | [Etherscan](https://sepolia.etherscan.io/address/0xbc0E5Af03b41FEB5ec5968Ddd324f3eC48017138) |
| Cash+ 2.0 | Pharos mainnet | `0x907C00D587DaFf16D028fE1e131d6DD3c6BF2F4B` | [SocialScan](https://pharos.socialscan.io/address/0x907C00D587DaFf16D028fE1e131d6DD3c6BF2F4B) |
| Cash+ 2.0 | Pharos Atlantic testnet | `0x4013361546efe989Efd4a1242aDD5Ea88915e980` | [Pharos Explorer](https://atlantic.pharos.io/address/0x4013361546efe989Efd4a1242aDD5Ea88915e980) |
| Bond+ 2.0 | Pharos mainnet | `0x286D9F099587f567EcE2b70eBB64B94ACD672d76` | [SocialScan](https://pharos.socialscan.io/address/0x286D9F099587f567EcE2b70eBB64B94ACD672d76) |
| Bond+ 2.0 | Plume mainnet | `0x0D90a6eE85d5668734bb3A515147f53EBDfE866c` | [Plume Explorer](https://explorer.plume.org/address/0x0D90a6eE85d5668734bb3A515147f53EBDfE866c) |
| Bond+ 2.0 | Ethereum mainnet | `0x28d77ea7c61cd9055983ef8b0806778d8bb12c88` | [Etherscan](https://etherscan.io/address/0x28d77ea7c61cd9055983ef8b0806778d8bb12c88) |
| YIELD+ 2.0 | Pharos mainnet | `0x87a1A531090bc58b34398E3cBa4C9b00c6B9231E` | [SocialScan](https://pharos.socialscan.io/address/0x87a1A531090bc58b34398E3cBa4C9b00c6B9231E) |
| YIELD+ 2.0 | Plume mainnet | `0xD9ffec462793e6627F223671E9C9b217C8103940` | [Plume Explorer](https://explorer.plume.org/address/0xD9ffec462793e6627F223671E9C9b217C8103940) |
| YIELD+ 2.0 | Ethereum mainnet | `0x37d03D8caBfB617e455D0cAA0Cf1cdc5b8F3BDEe` | [Etherscan](https://etherscan.io/address/0x37d03D8caBfB617e455D0cAA0Cf1cdc5b8F3BDEe) |
| YIELD+ 2.0 | BSC mainnet | `0xCCa4656F736490cf2155589aEcd8382765a3e691` | [BscScan](https://bscscan.com/address/0xCCa4656F736490cf2155589aEcd8382765a3e691) |
| NGI+ 2.0 | Pharos mainnet | `0x85f51213A6c3F2566aF519D296BB75AD4EC6d234` | [SocialScan](https://pharos.socialscan.io/address/0x85f51213A6c3F2566aF519D296BB75AD4EC6d234) |
| NGI+ 2.0 | Ethereum mainnet | `0xF252C5BD43907a6CAb079E990845a37a7C5730d9` | [Etherscan](https://etherscan.io/address/0xF252C5BD43907a6CAb079E990845a37a7C5730d9) |
| NGI+ 2.0 | BSC mainnet | `0x50BF2924ceE59737EAD76e881643eD8569BAe6e8` | [BscScan](https://bscscan.com/address/0x50BF2924ceE59737EAD76e881643eD8569BAe6e8) |
| PGNGI+ 2.0 | Pharos mainnet | `0x238Bd29Bc460F6cB56f80f99B2B39Ff2c183Ee4D` | [SocialScan](https://pharos.socialscan.io/address/0x238Bd29Bc460F6cB56f80f99B2B39Ff2c183Ee4D) |
| PGNGI+ 2.0 | Ethereum mainnet | `0x0e6fcE64D9e32ebF5D7cf3f6DEd501415EcA374c` | [Etherscan](https://etherscan.io/address/0x0e6fcE64D9e32ebF5D7cf3f6DEd501415EcA374c) |
| PGNGI+ 2.0 | BSC mainnet | `0x9d54F56e71923eBd0c61336916f91CFb3a3938C3` | [BscScan](https://bscscan.com/address/0x9d54F56e71923eBd0c61336916f91CFb3a3938C3) |
| PGNGI+ 2.0 | Arc | `0x0D90a6eE85d5668734bb3A515147f53EBDfE866c` | — |
| EPOCH+ 2.0 | Ethereum mainnet | `0x3bE5dD4a34F1C6a112048b9dF908cED4372D5049` | [Etherscan](https://etherscan.io/address/0x3bE5dD4a34F1C6a112048b9dF908cED4372D5049) |
| CASHa+ 2.0 | Ethereum mainnet | `0x907C00D587DaFf16D028fE1e131d6DD3c6BF2F4B` | [Etherscan](https://etherscan.io/address/0x907C00D587DaFf16D028fE1e131d6DD3c6BF2F4B) |
| CNCASH+ 2.0 | Ethereum mainnet | `0x286D9F099587f567EcE2b70eBB64B94ACD672d76` | [Etherscan](https://etherscan.io/address/0x286D9F099587f567EcE2b70eBB64B94ACD672d76) |
| GTCASH+ 3.0 | Ethereum mainnet | `0x63E19Fb814Eb737730ac0aFbb52B351695B97176` | [Etherscan](https://etherscan.io/address/0x63E19Fb814Eb737730ac0aFbb52B351695B97176) |
| HTCASH+ 3.0 | Ethereum mainnet | `0x50bDAFf4bCeB852F006F657f47C68fCC417f7bEb` | [Etherscan](https://etherscan.io/address/0x50bDAFf4bCeB852F006F657f47C68fCC417f7bEb) |
| mYIELD+ 3.0 | BSC mainnet | `0xFb8cB7630BC3cb34a6A9846Ec03De3A32393Ee65` | [BscScan](https://bscscan.com/address/0xFb8cB7630BC3cb34a6A9846Ec03De3A32393Ee65) |
| mYIELD+ 3.0 | Ethereum mainnet | `0xf3a2a5de306b063D75C86B6352832639b7263a3B` | [Etherscan](https://etherscan.io/address/0xf3a2a5de306b063D75C86B6352832639b7263a3B) |
| GFCASH+ 3.0 | Ethereum mainnet | `0x46c8055eD9D3c7DF3f515EE6Cd4a5b8616156719` | [Etherscan](https://etherscan.io/address/0x46c8055eD9D3c7DF3f515EE6Cd4a5b8616156719) |
| TKCASH+ 3.0 | Ethereum mainnet | `0x257c71ecDB944EC09780c97e874ED41e98E00913` | [Etherscan](https://etherscan.io/address/0x257c71ecDB944EC09780c97e874ED41e98E00913) |
