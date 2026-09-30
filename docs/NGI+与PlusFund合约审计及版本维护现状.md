# NGI+ 与 PlusFund 合约审计及版本维护现状

> 资料快照：2026-09-30。本文整理当前已核对的审计报告、本地代码分支和部署地址登记；不是链上实时核验结果，也不替代正式安全审计。

## 一页结论

- 产品名称相近不代表合约代码相同。目前至少要按两种存储结构、两条维护线管理：`main` 的 `Wallet` 队列结构，以及 `feature/stoken1.0` 的 `_tokenList + _tokenMap` 数组/映射结构。
- 新结构部署归入 `main` 维护线。仓库 `main` 中 PlusFund 合约版本为 `2.1.2`；同一结构原则上可以沿该线升级，但每个代理仍须单独做 OpenZeppelin 存储布局校验、初始化/角色检查、Timelock 与待处理申赎检查。
- 旧结构部署归入 `stoken1.0` 维护线，不应直接升级到 `main` 的 `Wallet` 存储结构。旧线当前合约标识为 `VERSION_3.1.0`；该编号与 `main` 的 `2.1.2` 属于不同代码线，不能按数字大小比较新旧。
- 用户提供的 SlowMist NGI+ 报告审计基线不是当前本地 PlusFund 仓库的 commit。它不能直接证明 `main`、`stoken1.0` 或线上代理当前实现均已审计。
- 若目标是“一份审计覆盖同系列产品”，应先以同一源代码、编译参数和依赖生成的实现字节码为边界。两个存储结构必须在审计范围中明确列为两个实现/两个目标；代理部署配置另做逐地址核验。

## 1. 两条维护线与产品结构

| 维护线 | 结构特征 | 当前仓库基线 | 升级策略 |
| --- | --- | --- | --- |
| `main` 新结构 | `mapping(address => Wallet) public wallets`，Wallet 内以 head/tail 索引管理 TokenEntry 队列 | PlusFund `version() = "2.1.2"`；当前 `main` 分支 HEAD 为 `daa0357`（2026-09-26，最新部署工具提交；合约版本仍为 2.1.2） | 在同一 Wallet 存储家族内维护升级；每个代理升级前必须独立验证存储兼容、初始化状态、权限与链上业务状态。 |
| `feature/stoken1.0` 旧结构 | `_tokenList` 与 `_tokenMap`，按用户维护 Token ID 数组及余额映射 | `VERSION = keccak256("VERSION_3.1.0")`；当前分支 HEAD 为 `5773008`（2026-07-26） | 旧结构问题与改进留在 `stoken1.0` 线维护；不能把 `Wallet` 实现直接作为旧代理的升级目标。 |

### 当前地址簿中的产品归类

地址与链信息以项目根目录 [`deploy-address.md`](../deploy-address.md) 为准，那里在每条代理地址旁标有结构标签。按已整理的登记：

- **旧结构 / `stoken1.0`**：Cash+（旧版）、Bond+（旧版）、AMCash、AMCash+ 的已标注部署。
- **新结构 / `main`**：Cash+ 2.0、Bond+ 2.0、Yield+ 2.0（ETH 地址除外，仍待核对）、NGI+ 2.0、Epoch 2、CASHa 2、CNCASH 2、GTCASH 3、HTCASH 3 的已标注部署。
- **尚未分类**：`ETH_YIELD2_PROXY_ADDRESS` 尚需核对当前实现的存储结构；`0x048A8AFA...` 在地址簿中同时有测试黑名单地址记录，不能仅凭地址名当作 PlusFund 代理归类。
- **测试网**：地址簿保留测试部署以便技术核对，但不纳入正式线上产品统计；相同地址出现在不同链时，按不同链上的部署分别判断。

这些标记代表目前的代码/地址整理结论，不代表刚刚从所有区块浏览器逐一重新读取了 implementation slot、验证源码或链上角色。执行升级前必须做逐代理核验。

## 2. NGI+ 审计报告基线

审计文件：用户提供的 `NGI+ Smart Contract Audit Report.pdf`（原文件位于桌面）。报告内容记载：

- 审计方：SlowMist；审计日期：2026-06-17 至 2026-06-17。
- 报告引用项目：`https://github.com/RealeFinance/ngi-plus`，审计 commit `40d4a2ebe8176d2aa24085b5647cb58ca752caaa`。
- 审计范围为该项目的 `contracts`，其中包含 `BaseStorage.sol`、`Blacklistable.sol`、接口及 `sAmMMF.sol`。
- 报告描述的系统包含 stablecoin 申购/赎回、黑名单、管理员确认、FIFO `Wallet` 队列和 CCIP mint/burn 接口。
- 报告记载当时尚未部署主网；发现项为 1 项 Medium 和 1 项 Suggestion，均为 Acknowledged。整体结果标为 Medium Risk。

**范围限制：**审计 commit 不存在于当前本地 PlusFund Git 对象/分支历史中，报告源仓库也与当前 `PlusFund` 仓库不同。因此本文对照的是“报告文字”与“当前本地 `main` / `feature/stoken1.0`”；要形成审计级别的精确差异清单，仍需取得报告所指源码快照，或由审计机构确认两仓库、commit 与交付代码的对应关系。

## 3. 审计发现与当前代码状态

| 报告编号 | 报告内容 | 当前代码对照 | 当前判断 |
| --- | --- | --- | --- |
| N1，Suggestion | `claimUSD` 的资产发送路径依赖 `safeTransferFrom` allowance。若 `assetSender` 保持为合约自身且未配置自授权，赎回可能失败。报告建议当发送方为合约自身时直接 `safeTransfer`；项目回应会按部署 SOP 将 `assetSender` 配为预先准备的 Safe 钱包。 | 当前 `main` 仍从 `assetSender` 调用 `safeTransferFrom`，未按报告建议加入合约自持资产的 `safeTransfer` 分支；代码另有“只有赎回用户本人可领取”的调用者检查，但它不解决 self-allowance 问题。 | **未由代码彻底消除，仍依赖部署配置/SOP。**每个代理须核验 `assetSender`、余额和 allowance；若可能使用合约自持资产，应另行设计并审计对应转账路径。 |
| N2，Medium | `STOKEN_ADMIN` 可管理/覆盖申赎请求、执行或销毁 Token，并可管理部分资产参数和黑名单；单一 EOA 权限被攻破会影响用户资金和系统运行。报告建议多签/Timelock，并逐步拆分职责角色。 | 当前 `main` 中资产接收方、发送方及服务费接收方配置使用 `DEFAULT_ADMIN_ROLE`；但申赎管理、暂停、黑名单等核心权限仍有多项由 `STOKEN_ADMIN` 控制。项目仓库有 Safe/Timelock 部署及操作示例，但示例本身不能证明线上地址已按此配置。 | **部分权限隔离，未完成全面角色拆分；线上治理状态待逐地址验证。**需核验管理员是否为 Safe/Timelock、签名阈值、延迟、proposer/executor 及各角色授予/撤销记录。 |

报告中“项目已认可整改”不等于报告机构复测通过，也不等于线上配置已经完成。当前核对未发现该报告的正式复审/整改确认文件。

## 4. 审计报告之后，本地仓库可确认的演进

下表是当前 PlusFund Git 历史中审计日期之后可见的合约演进；由于报告源 commit 不在本仓库，以下不应表述为相对报告快照的精确逐行 diff。

| 日期 / commit | 本地变化 | 与报告的关系 |
| --- | --- | --- |
| 2026-07-06，`328cd99` / `aef3240` | 将 `sAmMMF` / `FundYieldManualTraceV1` 整理、重命名为 PlusFund，并调整暂停、初始化/权限相关代码。 | 代码整理与维护演进；不能仅凭提交标题认定为 N1/N2 的审计修复。 |
| 2026-07-09，`654a0aa` / `b3ca86b` | 调整初始化和权限控制、转账与铸造逻辑；移除多处最低金额限制。 | 功能与运营规则变化，需纳入当前审计范围。 |
| 2026-08-13，`785a30c`（v2.1.1） | 为赎回数据加入链上/链下状态保护，防止链上赎回被错误地再次 burn；添加相应测试和升级说明。 | 新增的业务状态约束，不属于报告中两项发现的直接修复。 |
| 2026-08-18，`7c49919`（v2.1.2） | 申购/赎回增加来源标记和路径校验，避免链上、链下操作入口混用；增加模式隔离测试。 | 新增逻辑和存储使用变化，需由最新审计覆盖。 |
| 2026-07-26，`feature/stoken1.0` HEAD `5773008` | 保留 `_tokenList + _tokenMap` 旧存储结构，形成独立维护线；包含 v3.1.0 相关调整及升级材料。 | 此线与报告所述 Wallet 结构不是同一存储布局；报告不能自动覆盖此线。 |

关于旧线 v3.1.0 的细节，另见 [`docs/contract-upgrade-v3.1.0/02-code-difference-report.md`](contract-upgrade-v3.1.0/02-code-difference-report.md) 和 [`03-storage-and-permission-review.md`](contract-upgrade-v3.1.0/03-storage-and-permission-review.md)。这些是仓库内的升级差异/风险材料，不是第三方审计报告。

## 5. 下一版审计建议以什么为准

1. **主审计基线选当前 `main` 的明确 commit**，而不是只写“最新代码”。审计交付物应记录仓库 URL、commit SHA、Solidity 编译器和优化参数、依赖版本、完整 source bundle、编译产物及 storage layout。当前仓库 `main` 代码版本为 v2.1.2；开始审计前应冻结实际提交，避免分支继续变化。
2. **将旧线 `feature/stoken1.0` 单独纳入审计或单独出报告/附录。**它使用数组映射旧布局，不是 Wallet 主线的一个普通升级版本。若希望“一份报告覆盖两线”，审计委托书和报告必须明确包含两个 commit、两个 implementation、差异模块和各自升级约束，不能只审 main 后推定旧线也覆盖。
3. **按代码相同的产品组复用主报告。**只有在不同产品实现字节码/源代码、编译配置和继承依赖均一致时，才适合由同一份实现审计覆盖；每个代理另附部署参数与权限核查表。不同链地址本身不自动等于不同代码，但链配置、代币精度、CCIP 参数、角色持有人等仍需检查。
4. **为审计机构提供线上部署矩阵。**每个地址列出链、产品、proxy、implementation、实现代码版本、是否已验证源码、结构路线、管理员/Safe/Timelock、初始化状态及升级记录；明确区分主网与测试网。
5. **要求复核 N1/N2 并给出整改证据。**N1 应确认或修正合约自持资产转账路径及每个部署的 `assetSender` 配置；N2 应明确角色矩阵和真实链上治理控制者，决定是否拆分角色，并要求对整改后的代码/配置复测。另将 2026-08 的链上/链下路径约束、重复 burn 防护及所有后续功能纳入新审计范围。

## 6. 尚待完成的核实

- 对照报告所引用的 `ngi-plus` commit 与当前 `PlusFund` 两分支，取得可审计的精确源代码差异；目前该 commit 不在本地仓库历史中。
- 从各链读取地址簿中的代理 implementation slot 和已验证源码，特别是 `ETH_YIELD2_PROXY_ADDRESS` 与用途有歧义的 `0x048A8AFA...`。
- 逐个核验主网代理的实际合约版本、存储布局、Timelock 延迟、Safe 阈值以及 `DEFAULT_ADMIN_ROLE` / `STOKEN_ADMIN` / `POOL_ADMIN_ROLE` 持有人。地址簿中的“可升级路线”不是升级授权或升级安全结论。
- 确认 2026-08 后是否已有尚未纳入当前本地 HEAD 的合约实现变更；当前 main 最近提交是部署工厂配置检查，合约 `version()` 仍显示 v2.1.2。
- 确认 SlowMist 或其他审计机构是否出具本报告之后的整改复审/新版本报告。

## 面向管理层的简答

- **线上有几种合约结构？**目前整理为新 Wallet 结构和旧数组结构两类；其完整地址登记见 [`deploy-address.md`](../deploy-address.md)。
- **哪些属于旧/新结构？**旧结构沿 `stoken1.0` 维护；新结构沿 `main` 维护。`deploy-address.md` 已逐地址标记，ETH Yield+2 和歧义测试地址待核对。
- **新结构能否升级到最新？**可在 main 同一存储家族内按升级流程推进，但需逐代理通过存储布局、权限、状态和 Timelock 检查；不能把“路线可升级”理解为“无需验证即可升级”。
- **旧结构如何维护？**留在 `stoken1.0` 独立修复与升级；不直接跨到 Wallet 主线。长期将同时维护两条线，并在每次发布中分别记录 commit、审计状态和部署范围。
- **当前 NGI+ 报告能否覆盖所有同系列产品？**不能直接这么认定。报告仅绑定其所引用的 `ngi-plus` commit；尤其不能据此声称旧数组结构、当前 v2.1.2 或线上代理均已审计。
- **新报告以什么为准？**以冻结后的 main 明确 commit 为新结构主审计基线，并单独覆盖 stoken1.0 旧结构；若坚持单份报告，则必须在正式范围中同时锁定两条线及其各自 commit/实现。
