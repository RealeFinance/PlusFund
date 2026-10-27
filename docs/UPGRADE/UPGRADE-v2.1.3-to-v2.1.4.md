# PlusFund 2.1.3 → 2.1.4 升级说明

整理日期：2026-10-11  
版本定位：当前工作区源码升级；生成最终发布包和 commit 后，应在此补入对应 commit、implementation 地址及构建信息。

本文说明 PlusFund 从 `2.1.3` 升级到 `2.1.4` 的代码变化、兼容性影响及逐代理升级检查。本文不代表任何线上代理已升级。

## 1. 版本变化

| 项目 | `2.1.3` | `2.1.4` |
| --- | --- | --- |
| `PlusFund.version()` | `2.1.3` | `2.1.4` |
| 版本重点 | 管理员标识统一为 `PLUSFUND_ADMIN`，角色 ID 保持不变 | 安全审计整改：资金账户 fail-closed、零 ID 校验、赎回付款行为及零金额转账修正 |

## 2. 合约变化

### 2.1 资金账户配置

- 新部署代理的 `assetRecipient`、`assetSender`、`serviceFeeRecipient` 初始为零地址。
- 链上申购、链上赎回和赎回款领取会检查三个资金账户均已设置，且不是零地址或代理自身。
- 管理员设置资金账户时不能将代理自身作为接收地址。
- 新部署脚本会在部署后读回三个账户并与预期配置比较。

升级不会重跑 `initialize()`，已有代理的账户值不会自动改变。升级前应逐代理检查这三个地址；服务费多签地址仍须配置，申购服务费业务保持启用。

### 2.2 工厂黑名单权限映射

新工厂创建 Token 时，配置的 `blacklistAdmin` 被授予 `PLUSFUND_ADMIN`，而不是单独的 `STOKEN_BLACKLIST_ADMIN_ROLE`。该业务角色拥有完整的 PlusFund 管理权限，包含其他业务管理操作；配置时应确认权限范围符合治理要求。

已部署的非代理工厂不会因 Token implementation 升级而改变。存量 Token 的权限也不会自动迁移；应逐个确认黑名单操作地址是否持有 `PLUSFUND_ADMIN`，必要时由管理员单独授权。使用新逻辑部署新 Token 时，应部署或切换到新版工厂。

### 2.3 跨链导入来源 ID

跨链 `mint()` 对 `TokenData.id == 0` 的条目直接拒绝，防止零 ID 进入用户 provenance 队列。非零来源 ID 的行为不变。

### 2.4 赎回服务费和申购服务费

当前业务已取消赎回服务费拆分。链上 `claimUSD()` 将记录中的完整 `uAmount` 转给赎回用户，不再按 `RedemptionData.technicalServiceFee` 扣款或向服务费接收方另行转账。

申购服务费及其费率/多签配置继续保留。旧赎回记录字段、现有事件字段及费率配置存储不删除、不调整顺序；新的赎回流程不再计算或收取赎回服务费，费用记录按当前业务规则为零。

升级前必须人工确认没有待处理赎回订单，以避免历史非零服务费记录遇到新的全额付款规则。

### 2.5 ERC20 零金额转账

`transfer(0)` 和 `transferFrom(..., 0)` 在通过既有地址、黑名单和暂停检查后成功返回，并发出 `Transfer(from, to, 0)`；不会消费或写入 provenance 队列，也不会改变余额。`transferFrom` 仍会经过 allowance 检查；零额调用不消耗 allowance。非零转账仍使用原队列逻辑。

### 2.6 部署配置和升级脚本

- Hardhat 网络 RPC URL 和 Explorer API key 从本地 `.env` 读取，变量名示例见 `.env.example`；不要提交 `.env`。
- UUPS 准备脚本的 Safe 和 direct 路径共用 `callInitializer`。该开关默认关闭；direct 升级后会读回并打印 `maxQueueLength`。
- `2.1.3 → 2.1.4` 没有新增 reinitializer，也不要求执行 `initializeV2()`。升级脚本应保持 `callInitializer = false`。只有处理更早版本、并已逐代理确认需要执行某个初始化时，才显式启用对应 initializer。

## 3. ABI 与存储兼容性

- 本次没有新增或重排代理存储变量，也没有修改外部函数和事件的参数列表。
- `version()` 函数签名不变，返回字符串由 `2.1.3` 改为 `2.1.4`。
- `PlusFund` ABI 新增 `FundAccountsNotConfigured` 和 `InvalidFundAccount` 自定义错误条目；既有函数选择器和事件签名不变。
- 工厂对 `blacklistAdmin` 的角色授予行为改变，但产品配置结构和工厂外部函数签名不变。
- 不需要为 `2.1.4` 执行存储迁移。每个目标代理仍必须使用准确构建的 `2.1.4` implementation 执行 OpenZeppelin UUPS/storage validation。

## 4. 升级前检查

- [ ] 确认目标代理当前 implementation、`version()`、链和存储结构属于 Wallet/main 维护线。
- [ ] 核验每个代理没有待处理申购或赎回订单；申购扫描流程不在本次补充范围内，需按既定运营方式人工确认。
- [ ] 读取 `assetRecipient`、`assetSender`、`serviceFeeRecipient`；确保均为预期的外部多签/资金账户，且均不为零地址或代理自身。
- [ ] 确认申购服务费及其服务费多签配置仍符合产品设置。
- [ ] 核对 `blacklistAdmin` 对应地址是否具有预期的 `PLUSFUND_ADMIN` 权限；注意此角色权限范围较大。
- [ ] 确认旧配置中曾出现的 RPC/Explorer 值是否为仍有效的账户专属凭证；必要时轮换，并只通过 `.env` 提供。
- [ ] 对每个代理运行 `upgrades.validateUpgrade(proxyAddress, NewImplFactory, { kind: "uups" })`，并核对升级权限和 Safe/Timelock 治理配置。
- [ ] 确认升级 calldata 不调用 `initializeV2()`；逐代理检查当前 `maxQueueLength` 并记录升级前值。

## 5. 升级步骤

1. 使用仓库锁定的依赖和 Solidity 编译配置构建 `2.1.4` implementation。
2. 对每个代理单独执行 UUPS 与 storage validation；不要用先前版本的校验结果代替。
3. 由代理当前授权的 Safe/Timelock/管理员执行 UUPS 升级；本版本不附带 initializer calldata。
4. 升级后读取并记录 implementation 地址和 `version()`；确认 `version()` 返回 `2.1.4`。
5. 检查资金账户读值、业务角色、`maxQueueLength`、支持的支付代币及暂停状态。
6. 按产品流程确认链上申购、链上赎回和领取；检查赎回用户收到完整 `uAmount`，且没有赎回服务费拆分转账。
7. 对零金额 `transfer`/`transferFrom` 检查调用成功、事件存在、余额和 provenance 队列不变；同时确认暂停、黑名单、零地址及非零转账行为符合预期。

## 6. 未解决事项与验证边界

- provenance dust 仍可能占满接收者队列。本版本没有通用解决方案；收款方 opt-in、最小入账量/dust 清理、预留队列空间和提高上限均有产品或实现取舍，详见 [2.1.3 Astra 审计问题整理](../Audit-Reports/PlusFund-2.1.3-Astra-Security-Audit-Review.md)。
- 现有 Factory 和已部署 Token 不会因源码变更自动取得新角色映射；应按上文分别核验工厂版本和 Token 角色。
- 此说明记录的是当前工作区改动，不代表完整审计复测、生产部署、逐代理 storage validation 或发布批准已经完成。发布前应将最终 commit、编译产物和测试结果补录到发布记录。

## 7. 相关文件

- `contracts/token/PlusFund.sol`
- `contracts/factory/PlusFundFactory.sol`
- `deploy/deploy-plusfund-factory.js`
- `deploy/test/_deploy_PlusFund.js`
- `deploy/test/prepare-uups-upgrade.js`
- `hardhat.config.js`
- `docs/Audit-Reports/PlusFund-2.1.3-Astra-Security-Audit-Review.md`
