# PlusFund stoken1.0 3.1.0 → 3.1.1-stoken1.0 升级说明

整理日期：2026-10-21

版本定位：旧结构 `feature/stoken1.0` 维护线的当前工作区源码升级；线上部署状态以各代理 implementation 和链上版本读取结果为准。

本文说明旧结构 PlusFund 从 `3.1.0` 升级到 `3.1.1-stoken1.0` 的代码变化、兼容性影响及逐代理升级检查。本文不代表任何线上代理已升级。

## 1. 版本变化

| 项目 | `3.1.0` | `3.1.1-stoken1.0` |
| --- | --- | --- |
| `VERSION()` | `keccak256("VERSION_3.1.0")` | `keccak256("VERSION_3.1.1-STOKEN1.0")` |
| `version()` | 不提供 | 返回 `3.1.1-stoken1.0` |
| 存储结构 | `_tokenList + _tokenMap` | 保持 `_tokenList + _tokenMap`，不跨升级到 `main` 的 Wallet 结构 |
| 版本重点 | 旧线当前版本基线 | 支持空钱包的零金额转账，并提供与 `main` 类似的字符串版本读取接口 |

## 2. 合约变化

### 2.1 ERC20 零金额转账

- `transfer(0)` 和 `transferFrom(..., 0)` 在通过地址、黑名单和暂停检查后成功返回，并发出 `Transfer(from, to, 0)`。
- 零金额路径在读取或修改 `_tokenList`、`_tokenMap` 前直接返回，因此发送方没有 stoken 记录时也可以执行零金额转账；余额和 token ID 列表不变。
- `transferFrom` 仍检查 allowance。金额为零时不会消耗 allowance。
- 非零转账继续使用原有 token ID 队列迁移逻辑。

### 2.2 版本读取

- 保留 `VERSION()` 函数选择器，将返回值更新为 `keccak256("VERSION_3.1.1-STOKEN1.0")`。
- 新增 `version()`，返回 `3.1.1-stoken1.0`，明确标识旧结构维护线，避免与 `main` 版本序列混淆。
- 依赖 `VERSION()` 具体返回值的客户端、脚本和升级清单应更新为新的哈希值。

## 3. ABI 与存储兼容性

- 不新增、删除或重排代理存储变量。`VERSION` 是编译期常量；新增的 `version()` 是纯读取函数；零金额转账路径不写入存储。
- UUPS 存储布局预期与 `3.1.0` 相同；每个目标代理仍须使用最终构建产物单独运行 OpenZeppelin storage validation。
- 外部 ABI 新增 `version()` 只读函数；`VERSION()`、`transfer()` 和 `transferFrom()` 的函数选择器保持不变。`VERSION()` 的返回值发生变化，旧值比较逻辑须同步更新。
- 此版本只属于 `_tokenList + _tokenMap` 的 `stoken1.0` 升级家族。不得用 `main` 的 Wallet 实现升级旧结构代理。
- 不新增 initializer，不要求执行 `initializeV2()` 或其他存储迁移。

## 4. 升级前检查

- [ ] 确认目标代理当前 implementation、链和存储结构属于 `stoken1.0` 旧结构维护线。
- [ ] 读取并记录代理当前 `VERSION()`，确认升级前版本为 `keccak256("VERSION_3.1.0")`；核对代理地址和当前 implementation。
- [ ] 确认 UUPS 升级权限、管理员和 Safe/Timelock 治理配置。
- [ ] 使用最终 `3.1.1-stoken1.0` 源码及锁定依赖构建 implementation，并对每个目标代理运行 `upgrades.validateUpgrade(proxyAddress, NewImplFactory, { kind: "uups" })`。
- [ ] 确认升级 calldata 不附带 initializer 调用。
- [ ] 检查调用方对 `VERSION()` 返回值的硬编码，并准备切换为新哈希或新增的 `version()` 字符串读取方式。

## 5. 升级步骤

1. 使用仓库锁定的依赖和 Solidity 配置构建 `3.1.1-stoken1.0` implementation。
2. 对每个代理单独执行 UUPS/storage validation，并记录代理地址、当前 implementation 和校验结果。
3. 通过该代理已授权的管理员、Safe 或 Timelock 执行 UUPS 升级，不附带 initializer calldata。
4. 升级后读取并记录 implementation 地址、`VERSION()` 和 `version()`；确认分别返回 `keccak256("VERSION_3.1.1-STOKEN1.0")` 和 `3.1.1-stoken1.0`。
5. 确认业务角色、资金账户、支持代币配置和暂停状态符合升级前预期。
6. 在测试环境检查空钱包的 `transfer(0)` 与 `transferFrom(..., 0)` 成功、产生零额 `Transfer` 事件且余额和 token ID 列表不变；同时确认地址、黑名单和暂停限制仍生效，非零转账保持原行为。

## 6. 验证记录与边界

- 当前工作区已包含零金额早退、版本常量更新和 `version()` getter。
- `git diff --check` 已通过。
- 尚未在本次工作区运行编译、自动化测试、逐代理 storage validation 或线上读写；发布前须按本说明补齐并记录结果。
- 本说明记录当前源码差异，不代表发布批准、生产部署或任何代理已经升级。

## 7. 相关文件

- `contracts/token/PlusFund.sol`
- `docs/NGI+与PlusFund合约审计及版本维护现状.md`
