# PlusFund（stoken）审计整改状态

**基准审计报告**：`2026-08-22-plusfund-dev-zh.md`  
**状态更新时间**：2026-08-27  
**适用范围**：PlusFund、PlusFundFactory、工厂部署流程及 Token 升级流程

## 1. 总体结论

当前已完成工厂部署入口的三项关键加固：

- `poolAdmin` 必须是已部署且已加入白名单的合约地址；
- 新部署 Token 的 Timelock 延迟最低为 48 小时；
- 工厂治理 Safe 与 `DEPLOYER_ROLE` 操作员不得使用同一个地址。

同时，已将单个 Token 升级前的历史赎回兼容性检查固化为只读扫描脚本，并同步写入部署 Runbook。

目前没有通过新工厂部署的线上 Token，因此工厂白名单尚未用于线上 Token；首次工厂部署前必须先配置真实 TokenPool 白名单。

## 2. 审计问题整改状态

| ID | 原审计结论 | 当前状态 | 说明 |
| --- | --- | --- | --- |
| STK-11 | 重复销毁 | ✅ 已完成 | 原报告已确认修复，当前代码和回归测试保留。 |
| PFF-01 | `poolAdmin` 未校验为合约 | 🟡 部分完成 | 已新增工厂级白名单、合约代码校验和失败测试；`blacklistAdmin`、`ccipAdmin`、`executors`、`operator` 尚未统一做合约校验。 |
| STK-OFFCHAIN-TOCTOU | 链下赎回未锁仓 | 🔵 按业务前提降级 | 链下 U 不经过 PlusFund，系统只负责自身 Token 的 mint/burn。只要外部结算严格执行“先 burn 成功，再支付 U”，则不构成 PlusFund 直接资金损失；仍需作为业务流程约束。 |
| STK-11-LEGACY-BRICK | 升级后历史赎回可能无法领取 | 🟡 已建立升级前检查 | 已新增逐 Token 事件扫描脚本；每次升级前需确认 `pendingCount == 0`，如有遗留记录，先做 legacy claim 或迁移。 |
| XC-01 | 赎回金额与 Token 数量没有链上绑定 | ⏳ 待处理 | 当前属于受信任的 `STOKEN_ADMIN` 业务配置风险，尚未增加 sanity 区间。 |
| STK-INIT-EOA | 直接部署时初始化权限可能落到 EOA | ⏸ 暂缓 | 直接限制 `msg.sender` 会影响手动部署；当前保留手动部署能力，后续可改为显式传入并校验初始治理地址。 |
| PFF-03 | Timelock 最小延迟过低 | ✅ 已完成 | 工厂新增 `MIN_TIMELOCK_DELAY = 48 hours`，低于 48 小时的部署会失败。 |
| PFF-04 | UUPS 实现无 codehash/白名单 | ⏳ 待处理 | 当前仍只校验 `proxiableUUID()` 和合约代码存在。 |
| STK-06-R | 跨链 mint/burn 无合约内速率限制 | ⏳ 待处理 | 仍依赖受控 TokenPool；可后续增加额度或速率限制作为纵深防御。 |
| PFF-02 | EOA 拒绝测试不完整 | 🟡 部分完成 | 已补充 EOA `poolAdmin` 和未白名单合约测试；其他角色的负面测试仍可补充。 |
| PFF-05/06 | CREATE2 salt 和 DEPLOYER_ROLE 风险 | 🟡 部分完成 | 已强制 `factoryAdmin_` 与 `operator_` 不得是同一地址；salt 仍由调用方提供，`operator` 仍未强制为合约。当前按业务设计接受可预测 salt 和 EOA operator 风险。 |
| STK-TAGS | 缺少 git tag/release | ⏳ 待处理 | 属于发布流程整改，尚未处理。 |
| `_update` 死代码 | 黑名单钩子不会覆盖自定义记账路径 | ⏳ 待处理 | 当前安全性仍由各入口的 `notBlacklisted` 保证，建议补充维护注释。 |

## 3. 已完成的代码和文档修改

### 3.1 工厂 `poolAdmin` 白名单

文件：`contracts/factory/PlusFundFactory.sol`

已新增：

- `approvedPoolAdmins` 白名单映射；
- `setPoolAdminApproval(poolAddress, approved)` 管理函数；
- `PoolAdminApprovalUpdated` 事件；
- `InvalidPoolAdmin` 错误；
- 部署时的合约代码和白名单双重校验。

配置方式：

```solidity
setPoolAdminApproval(poolAddress, true)
```

该操作必须由工厂 `DEFAULT_ADMIN_ROLE` 对应的治理 Safe/多签执行。撤销白名单只影响后续新 Token 部署，不会自动撤销已部署 Token 上的 `POOL_ADMIN_ROLE`。

### 3.2 Timelock 最低 48 小时

文件：`contracts/factory/PlusFundFactory.sol`

```solidity
uint256 public constant MIN_TIMELOCK_DELAY = 48 hours;
```

`deployToken()` 和 `batchDeploy()` 使用同一套校验，低于 48 小时的配置会回退。

### 3.3 Token 升级前历史赎回扫描

文件：`deploy/scan-token-redemptions.js`

脚本只读指定 Token Proxy 的事件日志，比较：

- `onChainRedemptionEvent`；
- `overwriteOnChainRedemptionEvent`；
- `claimUSDEvent`。

使用方式：

```powershell
$env:RPC_URL = "https://your-rpc-endpoint"
$env:TOKEN_ADDRESS = "0xTokenProxyAddress"
$env:FROM_BLOCK = "12345678"
$env:OUTPUT = "token-redemption-scan.json"

npm run scan:redemptions
```

升级前必须确认：

```text
pendingCount == 0
```

如果存在待处理记录，脚本以退出码 `2` 结束，部署流水线应阻止升级继续。

### 3.4 Runbook 同步

文件：`docs/PlusFundFactory-Token-Deployment-Runbook.md`

已补充：

- `poolAdmin` 白名单配置顺序；
- 48 小时 Timelock 最低延迟；
- 白名单撤销的影响；
- 单个 Token 升级前的历史赎回扫描；
- 非跨链场景使用 `poolAdmin = address(0)` 的说明。

### 3.5 工厂部署脚本

文件：`deploy/deploy-plusfund-factory.js`

脚本支持部署 implementation、部署工厂、检查 `poolAdmin` 白名单、部署 Token、核验部署后角色，并输出部署清单。

运行时参数已集中在脚本顶部的 `DEPLOYMENT_CONFIG` 中，不再要求通过环境变量传入工厂和 Token 参数。脚本分为两个阶段：

1. `factoryAddress` 留空、`deployToken = false`：部署 implementation 和工厂；
2. 填写已部署的 `factoryAddress`、完善 `token` 配置并设置 `deployToken = true`：检查白名单后部署 Token。

如果 `poolAdmin` 尚未加入白名单，脚本只输出由治理 Safe 执行的 calldata，不会继续部署 Token。

## 4. 测试和验证

已验证：

- 工厂专项测试：9/9 通过；
- 合约编译通过；
- `git diff --check` 通过；
- 扫描脚本通过 Node.js 语法检查。

全量测试当前仍有仓库原有的 artifact 缺失问题，涉及 `BlackList`、`Oracle` 等未生成 artifact 的测试；这部分与本次工厂白名单和 Timelock 修改无关。

## 5. 首次工厂部署前检查清单

- [ ] 部署并审核目标链上的 TokenPool。
- [ ] 由工厂治理 Safe 执行 `setPoolAdminApproval(poolAddress, true)`。
- [ ] 查询 `approvedPoolAdmins(poolAddress)` 返回 `true`。
- [ ] 确认 `timelockDelay >= 172800`。
- [ ] 确认 `stokenAdmin`、`proposers`、`cancellers` 为预期治理合约。
- [ ] 确认工厂治理 Safe 与 `DEPLOYER_ROLE` 操作员地址不同。
- [ ] 使用 `DEPLOYER_ROLE` 调用 `deployToken()`。
- [ ] 部署后核验 Token 的 `POOL_ADMIN_ROLE` 持有者。
- [ ] 记录 Token、Timelock、implementation、TokenPool 和部署交易哈希。

## 6. 后续建议

优先级最高的后续事项是限制已部署 Token 后续授予 `POOL_ADMIN_ROLE` 时绕过工厂白名单的可能性。当前白名单只保护工厂初始部署入口；如果 Token 的 Timelock 可以通过通用 `grantRole()` 授予新的 `POOL_ADMIN_ROLE`，仍需依靠治理流程保证地址正确。

其他事项可根据业务和上线计划安排：

- 设计手动部署场景下的显式初始治理地址；
- 补充 mint/burn 金额 sanity check；
- 增加实现白名单或 codehash 约束；
- 增加 TokenPool 速率或额度限制；
- 完善角色负面测试和发布 tag/release 流程。
