# PlusFund 2.1.0 → 2.1.3 变更与升级说明

整理日期：2026-10-01

本文整理 PlusFund 从 `2.1.0` 到 `2.1.3` 的合约逻辑、部署治理和升级注意事项。

## 1. 版本范围

当前本地仓库未发现对应的 Git tag，因此使用合约 `version()` 和提交记录定位版本：

| 版本 | 提交 | 日期 | 版本重点 |
| --- | --- | --- | --- |
| `2.1.0` | `328cd99` | 2026-07-06 | PlusFund 初始版本 |
| `2.1.1` | `785a30c` | 2026-08-13 | 修复链上赎回重复销毁风险 |
| `2.1.2` | `7c49919` | 2026-08-18 | 隔离链上与线下业务入口 |
| `2.1.3` | 当前工作区 | 2026-10-07 | 更新版本号；将业务角色标识和 getter 改名为 `PLUSFUND_ADMIN`，保留旧角色 ID |

从 `2.1.0` 到 `2.1.3` 的变化不只有版本号更新，还包括若干中间提交中的合约、部署脚本、工厂和测试变更。`2.1.3` 当前记录的是工作区变更，形成最终 commit 后应将“当前工作区”替换为对应 commit。

## 2. 变化总览

### 2.1 合约逻辑

- 移除统一的 `0.01 stoken` 最小金额限制。
- 加强暂停状态下的 `mint()`、`burnFrom()` 行为。
- 修正 `transferFrom()` 的 allowance 扣减方式。
- 防止链上赎回被 `burn()` 二次销毁。
- 新增 `isOnChain`，严格区分链上和线下申购、赎回流程。
- v2.1.3 将业务角色的 Solidity 标识改为 `PLUSFUND_ADMIN`，但保持原有角色 ID 不变。

### 2.2 部署和治理

- 新增 `PlusFundFactory`，统一部署 ERC1967 Proxy 和产品级 Timelock。
- 增加 CREATE2 地址预测、批量部署和产品 ID 去重。
- 增加 UUPS implementation、治理地址和 Pool Admin 校验。
- 部署完成后清理工厂自身的敏感权限。
- 工厂和部署脚本使用新的 `PLUSFUND_ADMIN()` getter；旧 getter 不再提供。

### 2.3 升级风险

- `isOnChain` 是新增的存储字段，旧记录不会自动回填。
- 升级前必须处理未完成的链上申购和赎回记录。
- storage validation 通过不代表权限、初始化和业务状态可以直接升级。

## 3. 合约逻辑变更

### 3.1 2.1.0 之后的基础调整

这些调整发生在 v2.1.1 之前，但属于本次版本范围内的实际代码变化。

#### 金额限制

移除 `MIN_AMOUNT = 1e16`（即 0.01、18 位精度）及其相关检查，不再由该常量限制以下操作：

- `transfer()` 和 `transferFrom()`；
- `_mintStoken()`（影响 `execute()` 和 `claim()`）；
- `claimUSD()` 和 `burn()`；
- `overwriteOnChainSubscribe()` 中的 stoken 数量。

`mint()` 和 `burnFrom()` 原本就没有使用该 `MIN_AMOUNT` 检查，本次对它们的相关变化是增加了 `whenNotPaused`。

以下业务级限制仍然存在，并且仍可配置：

- `MIN_SUBSCRIPTION_USD_AMOUNT`：最小申购金额；
- `MIN_REDEMPTION_CASH_AMOUNT`：最小赎回金额。

因此，本次调整不是取消所有金额校验，而是移除了统一的 stoken 最小值校验。

#### 权限、暂停和 allowance

- `initializeV2()` 增加 `DEFAULT_ADMIN_ROLE` 限制。
- `mint()` 和 `burnFrom()` 增加 `whenNotPaused`。
- `transferFrom()` 改用 OpenZeppelin `_spendAllowance()`，替代手动计算并写回 allowance。

### 3.2 v2.1.1：防止链上赎回重复销毁

#### 原问题

`onChainRedemption()` 会先调用内部 `_burn()`，但赎回记录仍然保留。之后管理员通过 `overwriteOnChainRedemption()` 补齐数据时，原来的 `burn()` 仍可能再次处理同一条记录，造成重复销毁风险。

#### 修复内容

在 `RedemptionData` 中新增 `isOnChain`：

- `onChainRedemption()` 写入 `isOnChain = true`；
- 普通 `redemption()` 写入 `isOnChain = false`；
- `burn()` 仅允许处理线下赎回；
- 如果记录已有 `tokenTransferDetails`，即使旧记录没有 `isOnChain` 标记，也禁止再次销毁；
- `version()` 更新为 `2.1.1`。

#### v2.1.1 之后的赎回流程

```text
链上赎回：onChainRedemption
       → overwriteOnChainRedemption
       → claimUSD

线下赎回：redemption
       → burn
```

链上赎回在创建阶段已经完成 token 销毁，不能再进入线下 `burn()` 流程。

### 3.3 v2.1.2：隔离链上和线下业务入口

#### 数据模型

在以下两个结构体中新增 `isOnChain`：

- `SubscribeData.isOnChain`；
- `RedemptionData.isOnChain`。

此前部分逻辑主要依赖 `source` 判断来源；v2.1.2 改为使用明确的模式字段进行校验。

#### 入口矩阵

| 业务 | 创建入口 | 后续入口 | 必须满足的模式 |
| --- | --- | --- | --- |
| 链上申购 | `onChainSubscribe()` | `overwriteOnChainSubscribe()` → `claim()` | `isOnChain = true` |
| 线下申购 | `subscribe()` | `execute()` | `isOnChain = false` |
| 链上赎回 | `onChainRedemption()` | `overwriteOnChainRedemption()` → `claimUSD()` | `isOnChain = true` |
| 线下赎回 | `redemption()` | `burn()` | `isOnChain = false` 且未产生链上销毁明细 |

#### 具体校验

- `overwriteOnChainSubscribe()` 拒绝线下申购记录。
- `execute()` 拒绝链上申购记录。
- `claim()` 拒绝线下申购记录。
- `overwriteOnChainRedemption()` 拒绝线下赎回记录。
- `claimUSD()` 仅允许链上赎回记录，不再仅依赖 `source != 0`。
- `burn()` 继续禁止处理链上赎回记录。
- `version()` 更新为 `2.1.2`。

### 3.4 v2.1.3：更新版本号和业务角色标识

- `version()` 从 `2.1.2` 更新为 `2.1.3`。
- 合约常量和公共 getter 从 `STOKEN_ADMIN` 改名为 `PLUSFUND_ADMIN`，权限检查也统一使用新标识。
- 新常量值固定为 `0x1af9f09295e73130ad6fd58704a26fe468d3f3e194879e90badd83ab85dd89f9`，与旧实现的 `keccak256("STOKEN_ADMIN")` 相同。AccessControl 以 `bytes32` 角色 ID 保存成员，所以只要该值不变，已有地址授权无需迁移。
- 常量不占用代理存储槽；本次角色改名没有拆分权限，也没有修复审计报告 N2 所指的权限集中问题。
- `STOKEN_ADMIN()` getter 被移除，新增 `PLUSFUND_ADMIN()` getter。工厂接口、部署脚本和相关测试已同步改用新 getter。

**兼容性注意：**仍调用旧 Token getter `STOKEN_ADMIN()` 的已部署工厂或外部集成，在升级后调用会失败。已部署的非代理工厂不会因本次源码更新自动改变；若它仍负责新 Token 部署，需要部署/切换到使用 `PLUSFUND_ADMIN()` 的新版工厂，或者继续保留旧 getter 兼容层。

## 4. 部署和治理变更

### 4.1 PlusFundFactory

新增 [contracts/factory/PlusFundFactory.sol](../contracts/factory/PlusFundFactory.sol)，用于统一部署和配置产品实例。

主要能力：

1. 使用 ERC1967 Proxy 部署 PlusFund。
2. 为每个产品部署独立的 `TimelockController`。
3. 使用 CREATE2，并提供代理地址预测接口。
4. 支持批量部署，最多 5 个产品。
5. 通过 `productId` 防止重复部署。
6. 部署时统一配置角色、资产地址、支持的稳定币、最小金额和队列长度。
7. 要求 Timelock 延迟至少为 48 小时。
8. 校验 implementation 是否为有效 UUPS 合约。
9. 要求治理地址和 Pool Admin 使用已部署合约，并支持 Pool Admin 白名单。
10. 部署完成后放弃工厂对 token 和 Timelock 的敏感权限。

### 4.2 部署脚本和配置

同期更新了：

- `deploy/test/_deploy_SToken.js`；
- `deploy/test/prepare-uups-upgrade.js`；
- `.openzeppelin/` 网络 manifest；
- `deploy-address.md`；
- 工厂部署测试和模式隔离测试。

这些变更主要用于多产品、多网络部署，不改变 `PlusFund` 的业务接口，但会影响实际升级时的权限和 Timelock 操作方式。

## 5. 存储兼容性和升级风险

### 5.1 存储变更

`isOnChain` 是追加到现有结构体中的字段，v2.1.1/v2.1.2 的 `isOnChain` 变更不要求调用新的 initializer 或 reinitializer。

v2.1.3 只将角色常量和 getter 改名、保留角色 ID，并更新 `version()`；常量本身不改变代理存储布局。但仍须对每个目标代理用 v2.1.3 实现执行 `validateUpgrade`。2026-09-30 针对 v2.1.2 的 24/24 结果不能代替针对 v2.1.3 的逐代理校验。

仍然必须对每个代理单独执行：

```js
await upgrades.validateUpgrade(
  proxyAddress,
  NewImplFactory,
  { kind: "uups" }
);
```

### 5.2 历史记录风险

升级前已经存在、但尚未完成的旧记录不会自动获得正确的 `isOnChain` 值；新增字段的默认值可能是 `false`。

可能受到影响的记录包括：

- 尚未 `claim()` 的历史链上申购；
- 尚未 `claimUSD()` 的历史链上赎回；
- 尚未完成 `execute()` 或 `burn()` 的线下记录。

特别是旧的链上赎回记录，不能只依据 `source` 判断是否可以领取。升级前必须核对：

- 记录是否确实来自链上入口；
- `isOnChain` 的当前存储值；
- `tokenTransferDetails` 是否已经写入；
- 是否已经发生 token 销毁；
- 后续应进入 `claimUSD()` 还是 `burn()`。

当前代码没有自动回填历史记录模式的迁移函数，因此不建议在存在未完成记录时直接批量升级。

## 6. 升级操作清单

### 升级前

- [ ] 确认目标代理当前 implementation 和 `version()`。
- [ ] 扫描所有未完成的申购、赎回记录。
- [ ] 处理或明确标记历史链上记录，避免升级后模式判断错误。
- [ ] 核对 UUPS 升级权限、Safe/Timelock、角色持有人和 Timelock 延迟。
- [ ] 对每个代理执行 `validateUpgrade` 和 storage validation。
- [ ] 确认目标 implementation 与构建源码、编译器和 optimizer 配置一致。

### 部署和执行升级

1. 编译新的 `PlusFund` implementation。
2. 使用 OpenZeppelin upgrades 工具执行 UUPS 校验。
3. 通过当前代理的升级权限执行 `upgradeToAndCall`；本次 `isOnChain` 变更不需要 initializer calldata。
4. 如果使用 `PlusFundFactory` 或 Timelock，按照对应治理流程提交、等待和执行升级提案。

### 升级后

- [ ] `version()` 返回 `2.1.3`。
- [ ] `PLUSFUND_ADMIN()` 返回旧角色 ID `0x1af9f09295e73130ad6fd58704a26fe468d3f3e194879e90badd83ab85dd89f9`，并确认原授权地址仍有该角色。
- [ ] 工厂和所有外部集成均不再依赖已移除的 `STOKEN_ADMIN()` getter；仍使用旧 getter 的线上工厂已替换或由实现保留兼容 getter。
- [ ] 链上申购不能进入 `execute()`。
- [ ] 线下申购不能进入 `claim()`。
- [ ] 线下赎回不能进入 `claimUSD()`。
- [ ] 链上赎回不能再次进入 `burn()`。
- [ ] 角色、Timelock、asset recipient/sender 和支持币种配置正确。
- [ ] 对历史未完成记录进行业务状态复核。

## 7. 测试和参考文件

相关测试：

- `test/PlusFundOnChainRedemption.js`
- `test/PlusFundModeIsolation.js`
- `test/PlusFundFactory.js`

历史验证记录：

- `npx hardhat compile`：通过；
- v2.1.2 历史运行：`npx hardhat test test/PlusFundOnChainRedemption.js test/PlusFundFactory.js`，3 passing。

v2.1.3 本地验证：

- `test/PlusFundAdminRoleUpgrade.js` 与 `test/PlusFundFactory.js`：10 passing；包括旧 getter 代理升级后角色授权仍在、旧 getter 移除、新工厂使用新 getter，以及 OpenZeppelin `validateUpgrade` 检查。
- `test/PlusFundModeIsolation.js` 有一个申购流程以 `BelowMinAmount` 回退；该用例尚未通过。
- 未对线上 RPC 或 24 个代理执行 v2.1.3 校验；升级前仍需逐代理验证实现、存储布局、权限和未完成业务状态。

核心源码：

- `contracts/token/PlusFund.sol`
- `contracts/Interfaces/IPlusFund.sol`
- `contracts/factory/PlusFundFactory.sol`
