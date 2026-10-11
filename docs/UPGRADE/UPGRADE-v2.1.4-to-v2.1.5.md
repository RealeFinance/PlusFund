# PlusFund 2.1.4 → 2.1.5 升级说明

整理日期：2026-10-11  
版本定位：当前工作区源码升级；线上部署状态以各代理的 implementation 地址和链上 `version()` 为准。

本文说明 PlusFund 从 `2.1.4` 升级到 `2.1.5` 的代码变化、兼容性影响及升级检查。本文不代表任何线上代理已升级。

## 1. 版本变化

| 项目 | `2.1.4` | `2.1.5` |
| --- | --- | --- |
| `PlusFund.version()` | `2.1.4` | `2.1.5` |
| 版本重点 | 资金账户、来源 ID、零额转账和赎回结算整改 | 零份额申购保护；待处理线下订单 `offChainId` 防重复 |

## 2. 合约变化

### 2.1 零份额申购保护

- 线下 `subscribe()` 拒绝 `stokenAmount == 0`。
- 链上申购报价写入 `overwriteOnChainSubscribe()` 拒绝零份额。
- 最终 mint 路径再次检查份额，作为订单数据的最后一道保护。
- 使用已有 `InvalidAssetAmount()` 错误，不改函数参数、事件或存储布局。

### 2.2 待处理线下订单编号防重复

- `subscribe()` 和 `redemption()` 在创建线下订单时检查同类型的活动 `offChainId`；活动订单使用相同编号会回退 `DuplicateOfflineOrderId()`。
- 申购执行、赎回销毁完成后释放编号，订单完成后允许复用。
- 申购和赎回分别登记，同一个文本编号可以同时用于一笔活动申购和一笔活动赎回。
- 该检查只针对升级后创建并登记的订单。升级不会扫描或迁移历史订单编号；升级前应冻结新订单，并人工确认所有代理均没有待处理的线下申购或赎回。

## 3. ABI 与存储兼容性

- `version()` 函数签名不变，返回值由 `2.1.4` 改为 `2.1.5`。
- 外部函数参数和事件签名不变；新增 `DuplicateOfflineOrderId()` 错误，并将部分校验从 revert string 改为自定义错误。依赖旧 revert string 的客户端应改为识别自定义错误。
- 追加 `_activeOfflineOrderIds` 和 `_offlineOrderKeys` 两个存储映射，没有重排已有存储变量。
- OpenZeppelin UUPS 存储布局校验已针对仓库 HEAD 的基线实现和当前实现运行并通过。每个目标代理仍须以准确的 `2.1.5` 构建产物单独运行升级校验。
- 不新增 initializer，不需要执行 `initializeV2()` 或其他存储迁移。

## 4. 升级前检查

- [ ] 确认目标代理当前 implementation、`version()`、链和存储结构属于 PlusFund Wallet/main 维护线。
- [ ] 暂停创建新线下申购和赎回订单，并人工确认每个代理没有待处理的线下订单；完成升级后再恢复创建。
- [ ] 确认目标代理的升级权限和 Safe/Timelock 治理配置。
- [ ] 使用最终 `2.1.5` 源码及锁定依赖编译，并对每个目标代理运行 `upgrades.validateUpgrade(proxyAddress, NewImplFactory, { kind: "uups" })`。
- [ ] 确认升级 calldata 不包含 initializer 调用。

## 5. 升级步骤

1. 使用仓库锁定的依赖和 Solidity 配置构建 `2.1.5` implementation。
2. 对每个代理分别执行 UUPS/storage validation，并记录代理地址、当前 implementation 和校验结果。
3. 通过该代理已授权的 Safe/Timelock/管理员升级 implementation；不附带 initializer calldata。
4. 升级后读回并记录 implementation 地址及 `version()`，确认返回 `2.1.5`。
5. 确认关键业务角色、资金账户、暂停状态和支持代币配置保持预期。
6. 在测试环境验证零份额申购拒绝、活动 `offChainId` 重复拒绝、订单完成后编号可复用，再按业务流程恢复线下订单创建。

## 6. 验证记录与边界

- Hardhat 编译通过。
- `test/PlusFundModeIsolation.js` 定向回归测试 5 项通过，覆盖零份额拒绝、活动订单重复拒绝和完成后编号复用。
- 当前 PlusFund runtime 为 24,037 bytes，低于 EIP-170 的 24,576 bytes 上限。
- 相对仓库 HEAD 基线的 OpenZeppelin UUPS 存储布局校验通过。
- 未运行完整测试套件，未进行线上调用或部署。上述本地结果不能代替对每个生产代理的单独升级校验和部署后读回。

## 7. 相关文件

- `contracts/token/PlusFund.sol`
- `hardhat.config.js`
- `test/PlusFundModeIsolation.js`
- `docs/Audit-Reports/PlusFund-v2.1.4-Full-Security-Review-2026-10-11.md`
