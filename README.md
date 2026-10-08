# PlusFund

PlusFund is an upgradeable Solidity token infrastructure for RWA products that need subscription, redemption, token provenance, and role-based operational control across multiple EVM networks.

The current mainline implementation is `PlusFund.version() = 2.1.3`.

Repository: [github.com/RealeFinance/PlusFund](https://github.com/RealeFinance/PlusFund)

## What this project provides

- Upgradeable ERC-20 tokens using UUPS proxies.
- FIFO wallet accounting that preserves token-entry provenance during transfers and redemptions.
- Separate on-chain and off-chain subscription/redemption workflows.
- Configurable supported payment tokens, minimum amounts, queue length, and service-fee recipients.
- Role-based administration, pausing, and blacklist controls.
- Cross-chain token-data ingestion through pool-admin controlled `mint()` and `burnFrom()` interfaces.
- `PlusFundFactory` for product deployment with ERC1967 proxies and product-specific Timelocks.

This repository contains smart contracts and deployment tooling. It does not provide a frontend, custody service, payment settlement service, or a complete bridge implementation.

## Contract architecture

```text
PlusFund
├── ERC20Upgradeable / ERC20PermitUpgradeable
├── ERC20PausableUpgradeable
├── AccessControlEnumerableUpgradeable
├── UUPSUpgradeable
├── BaseStorage
└── Blacklistable

PlusFundFactory
├── ERC1967Proxy deployment
├── CREATE2 address prediction
├── Product configuration and duplicate-product protection
└── Per-product TimelockController deployment
```

The current `PlusFund` implementation uses a `Wallet` mapping with token-entry indexes. Historical `stoken1.0` deployments use the older `_tokenList + _tokenMap` layout and must not be treated as directly upgradeable to the current Wallet-based implementation. See [deploy-address.md](./deploy-address.md) for the structure classification of each recorded deployment.

## Business flows

### Subscription

```text
On-chain:  onChainSubscribe → overwriteOnChainSubscribe → claim
Off-chain: subscribe         → execute
```

### Redemption

```text
On-chain:  onChainRedemption → overwriteOnChainRedemption → claimUSD
Off-chain: redemption        → burn
```

The contract records whether a subscription or redemption is on-chain through `isOnChain`. Cross-mode entry points are rejected. An on-chain redemption burns the PlusFund token during creation and must not be processed again through the off-chain `burn()` path.

## Roles and controls

The main operational roles are:

- `DEFAULT_ADMIN_ROLE`: UUPS authorization and high-privilege configuration.
- `STOKEN_ADMIN`: operational configuration, pause control, subscription/redemption administration, and blacklist administration where assigned.
- `POOL_ADMIN_ROLE`: controlled cross-chain `mint()` and `burnFrom()` operations.
- `STOKEN_BLACKLIST_ADMIN_ROLE`: blacklist administration.

Deployments should place privileged administration behind the configured Safe/Timelock governance process. `PlusFundFactory` enforces a minimum Timelock delay of 48 hours and validates configured governance contracts.

## Repository layout

```text
contracts/
├── token/PlusFund.sol              # Main upgradeable token implementation
├── factory/PlusFundFactory.sol     # Proxy and Timelock deployment factory
├── base/BaseStorage.sol            # Shared asset and supported-token storage
├── Interfaces/IPlusFund.sol        # Data structures and events
├── BlackList/Blacklistable.sol     # Blacklist behavior
└── mocks/                          # Local test contracts

deploy/                             # Deployment and operational scripts
test/                               # Hardhat tests
docs/                               # Deployment runbooks and audit notes
deploy-address.md                   # Unified deployment address registry
docs/UPGRADE-v2.1.0-to-v2.1.3.md   # Version changes and upgrade guidance
```

## Requirements

- Node.js 18 or newer
- pnpm
- An EVM RPC endpoint for the target network
- A deployer key stored outside the repository

The project uses Solidity `0.8.22`, optimizer runs `100`, and `viaIR: true`. The dependency lockfile is `pnpm-lock.yaml`.

## Install and verify locally

```bash
corepack enable
pnpm install

pnpm run c
pnpm test
```

`pnpm run c` compiles the contracts. `pnpm test` runs the Hardhat test suite, including the factory, mode-isolation, and on-chain-redemption regression tests.

## Local deployment examples

Deploy a local mock payment token:

```bash
pnpm exec hardhat run deploy/deploy-mock-usdc.js --network hardhat
```

Deploy the factory to a configured network:

```bash
pnpm exec hardhat run deploy/deploy-plusfund-factory.js --network bscTestnet
```

Before using a deployment script:

1. Review the `DEPLOYMENT_CONFIG` values in the script.
2. Set the required private key and RPC environment variables.
3. Confirm the target network, implementation address, product ID, salt, roles, supported payment tokens, and Timelock configuration.
4. Run the deployment from a clean, reviewed working tree and save the generated deployment manifest.

The factory deployment flow is documented in [docs/PlusFundFactory-Token-Deployment-Runbook.md](./docs/PlusFundFactory-Token-Deployment-Runbook.md).

## Environment and deployment safety

Do not commit private keys, API keys, or production deployment configuration to Git. The repository ignores `.env`; create it locally and provide only the variables required by the selected network, such as:

```text
PRIVATE_KEY_2=your_deployer_private_key
ARC_RPC_URL=your_arc_rpc_url
RPC_URL=your_scan_rpc_url
TOKEN_ADDRESS=target_token_address
FROM_BLOCK=deployment_block
```

Review `hardhat.config.js` before a public deployment. Network endpoints and explorer settings are configured there, and some networks may require additional custom-chain configuration.

## Upgrade policy

`PlusFund` uses UUPS upgrades authorized by `DEFAULT_ADMIN_ROLE`. A successful storage-layout check is necessary but not sufficient for a production upgrade.

Before upgrading an existing proxy:

- Run OpenZeppelin `validateUpgrade` for each proxy.
- Confirm the implementation source, compiler settings, optimizer settings, and `viaIR` configuration.
- Verify Safe/Timelock ownership, upgrade roles, and delay configuration.
- Scan for unfinished subscriptions and redemptions.
- Resolve historical on-chain records before upgrading to a version that relies on `isOnChain`; old records do not receive an automatic mode backfill.

See [PlusFund 产品版本更新说明](./docs/PlusFund-产品版本更新说明.md) for a product and user-facing summary. See [UPGRADE-v2.1.0-to-v2.1.3.md](./docs/UPGRADE-v2.1.0-to-v2.1.3.md) for the version-specific technical change log and upgrade checklist.

## Security and audit notes

The repository includes audit and remediation notes, but they are documentation of the current project state and are not a guarantee of security. Review:

- [Audit and remediation status](./docs/PlusFund-Audit-Remediation-Status-2026-08-24.md)
- [NGI+ and PlusFund maintenance status](./docs/NGI+与PlusFund合约审计及版本维护现状.md)
- [Deployment runbook](./docs/PlusFundFactory-Token-Deployment-Runbook.md)

If you discover a security issue, avoid opening a public issue with exploitable details. Contact the project maintainers through the repository's configured security channel first.

## Main dependencies

```text
@openzeppelin/contracts 5.4.0
@openzeppelin/contracts-upgradeable 5.4.0
@chainlink/contracts 1.4.0
dotenv 16.6.1
hardhat 2.26.3
@openzeppelin/hardhat-upgrades 2.5.1
@nomicfoundation/hardhat-toolbox 6.1.0
@nomicfoundation/hardhat-chai-matchers 2.1.0
@nomicfoundation/hardhat-verify 2.1.1
patch-package 8.0.1
```

These are the resolved versions in `pnpm-lock.yaml`; the version ranges declared in `package.json` may be broader.

## License

This repository currently does not include a `LICENSE` file. Confirm the project’s licensing terms with the maintainers before redistributing or using the contracts in another product.
