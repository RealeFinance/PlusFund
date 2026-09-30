# NGI+ 与 PlusFund 合约审计及版本维护现状

> 资料快照：2026-09-30。本文对照当前 `main` 与 `feature/stoken1.0` 分支的代码及地址簿；地址簿比对不等于链上实时核验，也不替代正式审计。

## 一页结论

- 当前按两种存储结构、两条长期维护线管理：`main` 的 `Wallet` 队列结构；`feature/stoken1.0` 的 `_tokenList + _tokenMap` 结构。
- 新结构部署归入 `main` 维护线。当前 main 合约版本为 `2.1.2`；只能在同一 Wallet 存储家族内按升级流程推进，逐代理通过存储布局、权限、初始化和待处理业务状态检查。
- 旧结构部署归入 `stoken1.0` 维护线，标识为 `VERSION_3.1.0`。它与 main 的版本号不是同一编号序列，不能按数字大小比较，也不能把 Wallet 实现直接升级到旧代理。
- `main` 与 `stoken1.0` 的地址簿确有分支差异：PGNGI+ 2.0、mYIELD+ 3.0、GFCASH+ 3.0、TKCASH+ 3.0 虽只登记在 main，但对应部署提交调用 `PlusFund`，同提交源码采用 Wallet 新结构；反向差异是旧 Cash+ 的 BNBT/BSC Timelock 仅见于 stoken1.0 地址簿。
- “只在某分支地址簿出现”是登记来源；新/旧结构判断另以部署脚本和对应提交源码中的存储结构为证据。链上当前 implementation 和治理关系仍需逐地址复核。
- SlowMist NGI+ 报告绑定的是另一个仓库 `RealeFinance/ngi-plus` 的指定 commit，不能自动覆盖当前 main、stoken1.0 或所有线上代理。

## 1. 两条代码维护线

| 维护线 | 存储结构 | 当前代码标识 | 维护/升级原则 |
| --- | --- | --- | --- |
| `main` 新结构 | `mapping(address => Wallet) public wallets`；Wallet 中用 head/tail 索引管理 TokenEntry | PlusFund `version() = "2.1.2"`；main HEAD `daa0357`（2026-09-26，近期提交为部署配置检查） | 同一 Wallet 存储家族内演进；升级前逐代理做 storage validation、角色/Timelock检查、初始化检查和未完成申赎核对。 |
| `feature/stoken1.0` 旧结构 | `_tokenList` + `_tokenMap`，按账户保存 Token ID 列表和余额 | `VERSION = keccak256("VERSION_3.1.0")`；当前 HEAD `5552624`（2026-09-30，文档提交），最近代码基线 `5773008`（2026-07-26） | 旧结构修复和升级长期留在 stoken1.0；不直接跨到 main 的 Wallet 存储结构。 |

### 产品路线（按现有结构核对）

- **旧结构 / stoken1.0**：旧版 Cash+、旧版 Bond+、AMCash、AMCash+ 的已标注代理。
- **新结构 / main**：Cash+ 2.0、Bond+ 2.0、已核对的 Yield+ 2.0、NGI+ 2.0、Epoch+ 2.0、CASHa+ 2.0、CNCASH+ 2.0、GTCASH+ 3.0、HTCASH+ 3.0，以及 main 地址簿独有的 PGNGI+ 2.0、mYIELD+ 3.0、GFCASH+ 3.0、TKCASH+ 3.0。独有产品的结构由部署时的脚本和源码确认；当前代理 implementation 仍应链上复核。
- **结构待核**：ETH Yield+ 2.0；现有记录不足以确认该代理当前 implementation 的存储布局。
- 测试网条目保留作技术参考，不计入正式线上产品统计。相同地址若在不同链，按不同链的独立部署核对。

## 2. main 与 stoken1.0 部署地址簿差异

比较对象是两个分支各自的 `deploy-address.md`。在两边均存在的同名代理记录中，本次 diff **未发现 proxy 地址值冲突**；差异主要是地址簿快照/条目增删和治理信息是否记录。详细地址仍以本文件所列当前 main 地址簿为准。

按地址字段名逐项比较：`main` 有 50 个地址字段，`feature/stoken1.0` 有 42 个；main 独有 10 个字段，stoken1.0 独有 2 个字段；同名字段地址值冲突为 0。计数是 2026-09-30 地址簿快照，不等同于线上活跃代理数量。

| 差异方向 | 产品/字段 | 对照结果 | 处理口径 |
| --- | --- | --- | --- |
| main 有、stoken1.0 无 | PGNGI+ 2.0：Pharos、ETH、BSC、ARC | 四个代理只见于 main。Aug 8 `923a17d` 部署脚本调用 `PlusFund`，同提交源码为 Wallet；ARC 在 Sep 14 `dda1215` 加入，源码仍为 Wallet。 | **新结构 / main**。地址簿独有不代表产品已下线；链上当前 implementation 仍须复核。 |
| main 有、stoken1.0 无 | mYIELD+ 3.0：BSC、ETH | Jul 9 `15f5c0c` 部署脚本使用 `PlusFund`，同提交源码为 Wallet v2.1.0；proxy 和 Timelock 只见于 main 地址簿。 | **新结构 / main**。Timelock 与代理控制关系仍待链上核实。 |
| main 有、stoken1.0 无 | GFCASH+ 3.0：ETH | Aug 12 `a7ad71e` 部署记录中的 `PlusFund` 源码为 Wallet 结构。 | **新结构 / main**；保留 main 独有登记来源。 |
| main 有、stoken1.0 无 | TKCASH+ 3.0：ETH | Aug 12 `a7ad71e` 部署脚本指向 `PlusFund`，同提交源码为 Wallet 结构。 | **新结构 / main**；保留 main 独有登记来源。 |
| stoken1.0 有、main 无 | 旧 Cash+ BNBT 测试网 Timelock `0xAD4f…`；BSC Timelock `0x9332…` | 两条 Timelock 记录仅见于 stoken1.0 地址簿；代理记录两边都有 | 当前 main 地址簿标为“仅见 stoken1.0；main 缺项，待链上核实”，不静默丢弃或冒充已验证配置。 |
| 两边均有 | Cash+、Cash+ 2.0、Bond+、Bond+ 2.0、AMCash、AMCash+、Yield+ 2.0、NGI+ 2.0、Epoch+ 2.0、CASHa+ 2.0、CNCASH+ 2.0、GTCASH+ 3.0、HTCASH+ 3.0 | 同名地址记录一致；stoken1.0 分支为共享条目加结构标签，main 保留其分支独有产品 | 已知结构按 Wallet/数组路线标记；对不能从现有证据确认的实现保留待核。 |

**main 地址簿上的标记约定：**

- `[旧结构 / stoken1.0]` / `[新结构 / main]`：已整理的结构维护路线，不代表已对所有链上 implementation slot 重新读取。
- `[新结构 / main；分支独有登记]`：部署提交的脚本和同提交 PlusFund 源码支持 Wallet 结构判断；“分支独有”仅说明地址簿来源。仍须链上确认当前 implementation。
- `[仅见于 stoken1.0 地址簿；main 缺项，待链上核实]`：反向差异，保留来源信息等待确认。
- `[用途待核对]`：例如 `0x048A8AFA...` 同时被地址簿列为 `TESTNET_BlockList`，暂不当作 PlusFund 代理。

完整逐链地址与标注见项目根目录 [`deploy-address.md`](../deploy-address.md)。

## 3. NGI+ 审计报告基线

审计文件为用户提供的 `NGI+ Smart Contract Audit Report.pdf`。报告记载：

- 审计方 SlowMist，审计日期 2026-06-17。
- 审计版本链接 `https://github.com/RealeFinance/ngi-plus`，commit `40d4a2ebe8176d2aa24085b5647cb58ca752caaa`。
- 范围包括 `BaseStorage.sol`、`Blacklistable.sol`、接口及 `sAmMMF.sol`；报告描述 FIFO `Wallet`、stablecoin 申购赎回、黑名单与 CCIP mint/burn。
- 报告称当时尚未部署主网；发现 1 项 Medium 和 1 项 Suggestion，均为 Acknowledged，报告总评为 Medium Risk。

**重要范围限制：**报告所指 commit 不在当前 PlusFund 本地 Git 历史，且报告源仓库和当前仓库不同。本文只能将报告文字与当前两条本地代码线对照；要做精确源码 diff，须取得该审计 commit 的源码快照，或由审计机构确认两个仓库与交付代码的关系。Wallet 描述也意味着不能由这份报告推定数组结构旧线已审计。

## 4. 审计发现和当前状态

| 编号 | 报告发现 | 当前 main 对照 | 判断 |
| --- | --- | --- | --- |
| N1，Suggestion | `claimUSD` 使用 `safeTransferFrom`；若 `assetSender` 是合约自身且未配置自授权，赎回可能失败。报告建议合约自持资产场景改用 `safeTransfer`；团队回应会按部署 SOP 将发送地址设置为预备 Safe。 | 当前 main 仍对 `assetSender` 使用 `safeTransferFrom`。代码另有限制只能由赎回用户领取，但这不解决 self-allowance 风险。 | 代码未彻底消除此风险，仍依赖资产发送地址配置/SOP；逐代理核验 `assetSender`、余额和 allowance。 |
| N2，Medium | `STOKEN_ADMIN` 控制多个申赎、执行/销毁、资产参数和黑名单操作，存在权限集中风险；建议多签/Timelock并逐步拆分权限。 | main 将资产接收方、发送方和服务费接收方配置放到 `DEFAULT_ADMIN_ROLE`；申赎操作、暂停、黑名单等仍有多项由 `STOKEN_ADMIN` 控制。仓库有 Safe/Timelock 脚本示例，但不能证明链上已按此配置。 | 部分隔离、未全面拆权；线上治理状态待逐代理核实 Safe 阈值、Timelock 延迟、proposer/executor 和角色持有人。 |

报告里的 Acknowledged 不是审计复测通过，也不是线上整改已完成的证据。当前材料中尚未找到该报告的正式整改复审文件。

## 5. 报告之后的本地代码演进

由于审计 commit 不在 PlusFund 本地历史，下表是审计日期后本仓库可见的演进记录，不应称为相对审计基线的精确行级差异：

| 日期 / commit | 代码演进 | 说明 |
| --- | --- | --- |
| 2026-07-06，`328cd99` / `aef3240` | 整理并重命名 `sAmMMF` / `FundYieldManualTraceV1` 为 PlusFund，调整暂停、初始化和权限相关实现。 | 维护演进；不能仅凭提交标题认定是 N1/N2 的修复。 |
| 2026-07-09，`654a0aa` / `b3ca86b` | 调整初始化、权限、转账和铸造逻辑；移除多处最低金额限制。同日 `15f5c0c` 的 mYIELD 部署脚本使用 PlusFund，源码已为 Wallet v2.1.0。 | 新功能/运营规则需进入后续审计范围；mYIELD 虽缺于 stoken 地址簿，部署结构可由同提交源码确认。 |
| 2026-07-26，`5773008` | 保留旧数组/映射存储，继续维护 `VERSION_3.1.0` 线；这是已确认的旧线代码基线。 | 与 Wallet 主线的存储结构不同，需单独审计/升级管理。 |
| 2026-08-08，`923a17d` | PGNGI+ 2.0 部署脚本调用 PlusFund；对应提交源码为 Wallet v2.1.0。 | 确认该组地址为新结构 / main；ARC 地址后于 `dda1215`（2026-09-14）登记，其源码同为 Wallet。 |
| 2026-08-12，`a7ad71e` | 部署 GFCASH+、TKCASH+；对应 PlusFund 源码为 Wallet 结构。 | 确认两项为新结构 / main。 |
| 2026-08-13，`785a30c`，v2.1.1 | 加入链上/链下赎回状态保护，避免链上赎回被再次 burn；补充测试和升级说明。 | 报告之后的业务逻辑变化。 |
| 2026-08-18，`7c49919`，v2.1.2 | 为申购/赎回增加来源标记和路径校验，防止链上、链下入口混用；增加模式隔离测试。 | 新增状态与校验逻辑，应纳入当前主线审计。 |
| 2026-09-30，`5552624` | `feature/stoken1.0` 上提交审计/维护说明和地址结构标记。 | 文档提交，不改变旧线合约代码；也是本次地址簿比较的 stoken1.0 快照。 |

旧线 v3.1.0 的代码差异及存储/权限检查材料位于 `feature/stoken1.0` 分支的 `docs/contract-upgrade-v3.1.0/`（当前 main 不含这些文件）；它们是项目内部材料，不是第三方审计结论。

## 6. 下一版审计基线建议

1. 以冻结后的 main 明确 commit 作为新结构审计对象，记录仓库 URL、commit SHA、Solidity/优化参数、依赖版本、源码包、构建产物和 storage layout；不要只写“最新代码”。
2. 将 `feature/stoken1.0` 旧结构单独纳入审计或单独出报告/附录。若目标仍是一份报告覆盖两线，委托范围必须明确包含两个 commit、两个实现及各自的差异和升级约束。
3. 只有源代码、编译配置、继承依赖/实现字节码一致的产品才能共用同一实现审计；代理地址另附逐链部署、权限、代币精度、CCIP 参数和治理核验表。
4. 纳入并复核 N1/N2，要求提供整改代码或部署配置证据，并由审计机构复测；同时覆盖重复 burn 防护、链上/链下模式隔离等 2026-08 后新增逻辑。
5. 对 main 地址簿独有的 PGNGI、mYIELD、GFCASH、TKCASH 产品，已可按部署提交归入 Wallet 新结构 / main；审计与升级前仍要核验代理当前 implementation、活跃状态和治理关系，避免因 stoken1.0 地址簿缺项而漏列。

## 7. 待核实项

- 取得报告引用的 `ngi-plus` commit 源码快照，厘清与当前 PlusFund 的关系并做精确 diff。
- 对所有登记地址读取链上 implementation slot/验证源码；特别核对 ETH Yield+ 2.0、main 独有产品当前是否仍指向 Wallet 实现，以及 `0x048A8AFA...` 的用途。
- 核实 stoken1.0 地址簿中 BNBT/BSC Cash+ Timelock 记录是否仍为真实治理配置，并同步给 main 地址簿的正式地址清单。
- 逐代理核对 main 主网地址的真实实现版本、存储布局、Safe 阈值、Timelock 延迟及各角色持有人。
- 确认 2026-08 后是否还有未纳入当前本地 main HEAD 的合约实现提交，以及是否有 SlowMist 整改复审报告。

## 管理层简答

- **当前有几类实现？**至少两类：Wallet 新结构和 `_tokenList + _tokenMap` 旧结构，长期分别由 main 与 stoken1.0 维护。
- **新结构是否都可升级到最新？**同属 Wallet 家族的代理可按 main 线推进，但仍需逐代理通过存储、安全和治理检查；不能把“同路线”视为免验证。
- **旧结构怎么处理？**留在 stoken1.0 线维护，不跨结构升级到 Wallet 主线。
- **main 与 stoken1.0 地址簿一样吗？**不一样。main 多列的 PGNGI+、mYIELD+、GFCASH+、TKCASH+ 已依据部署提交/源码标为新结构 / main；stoken1.0 多列 BNBT/BSC 旧 Cash+ Timelock；同名地址记录未发现冲突。
- **NGI+ 报告是否覆盖全部产品和当前代码？**不能据当前证据这么说；报告只绑定其引用的 ngi-plus commit，旧结构线和当前代理部署均需明确纳入/核实。
- **新报告以什么为准？**冻结后的 main commit 做新结构主审计，stoken1.0 单独审计或明确纳入同份报告；按相同实现分组复用审计结论，部署配置逐地址核查。
