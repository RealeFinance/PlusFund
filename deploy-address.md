# 部署地址统一登记
#
# 本文件是 PlusFund 部署地址的唯一合并登记文件，内容合并自：
# - main
# - feature/stoken1.0
#
# 合并规则：
# 1. 同名变量在两个分支中的地址值未发现冲突；保留为一条记录。
# 2. main 独有的 PGNGI+、mYIELD+、GFCASH+、TKCASH+ 记录一并保留。
# 3. feature/stoken1.0 独有或仅在旧地址簿出现的 Timelock/测试网记录不删除，明确标记来源和待核实状态。
# 4. 代理合约按实现结构标记；Timelock 默认继承对应代理的结构，除非另有“关系待核”说明。
# 5. 相同地址部署在不同链上按不同部署记录处理；测试网不计入正式主网产品统计。
#
# 结构标记：
# [新结构 / main]      使用 Wallet 映射（Wallet 新结构家族），可在 main 维护线上继续评估升级。
# [旧结构 / stoken1.0] 使用 _tokenList + _tokenMap，不直接升级到 Wallet 主线。
# [待核实]             当前资料不足以确认实现结构、代理关系或业务用途，不做升级推断。
# [非 PlusFund]        配套地址或其他系统地址，不适用 PlusFund 新旧结构分类。
#
# 所有代理升级前仍须逐代理执行 storage validation，并核对 implementation、权限、Timelock
# 和未完成的链上申购/赎回状态。2026-09-30 的主网只读核验显示：已登记为新结构的 24 个代理
# 均有 EIP-1967 implementation，wallets(address) 均返回 96 字节 Wallet 字段；当前 main 2.1.2
# 对这 24 个代理的 OpenZeppelin validateUpgrade 均通过，但这不替代权限和业务状态核验。

# 多签
TOKEN_KYC_ADMIN=0xCaCE62A138C20E7eE3CA74F52CC8D81Dd5b54017
TOKEN_PRODUCT_ADMIN=0xD8134c93C796F5905e520C274fAD7Da53e7bE0a5
TOKEN_PRICE_ADMIN=0xc586CA1D8a5c5A26941749d283395a148a56bf55
TOKEN_OFFCHAIN_ADMIN=0xeF76110dC81Dae765e70c5d702529c51730fD6f7
TOKEN_LIMITATION_ADMIN=0x98e35Cb96510503bd207E23Ab75da4E272EBa07C
TOKEN_ASSET_ADMIN=0x1Aa8D71a900283a2C4f57469fAAF7D512d43D18e
# 多签


TESTNET_BlockList_ADDRESS=0x048A8AFA8cF69EA53B72298d50033d1E2560b809
TESTNET_AllowList_ADDRESS=0x498D9329555471bF6073A5f2D047F746d522A373


# AOABT
TESTNET_AOABT_ADDRESS=0x090adbc831EFd28d580037a3994b2Cfa923fd9a1
TESTNET_AOABT_BlockList_ADDRESS=0x0A9E9C32eE3bE373cf542A0eD40a6567e12C2319
TESTNET_AOABT_AllowList_ADDRESS=0xa68294A400CBE5e557EFA00f7fD72F03b2993228
TESTNET_rAmMMF_proxy_ADDRESS=0x7d2f9E03EF01d7aF216385DdBd2D632DECd94a18


# AOABTB
TESTNET_AOABTB_ADDRESS=0x75f33235FD983A930C27EC273F0E7480477d7210
TESTNET_AOABTB_BlockList_ADDRESS=0x50e04310fc0F7D1a35Ad28D24653d124fDDE5486
TESTNET_AOABTB_AllowList_ADDRESS=0x122d3af8206e28988CabA4FD151D06635d24898E
TESTNET_rAOABTB_proxy_ADDRESS=0x804063066723CBc79d5c41452eB581C05065D520


# reUSD
TESTNET_reUSD_proxy_ADDRESS=0x35AF14879C0Fe7461c2Eb7AbA27eA9853eCDA8ad
TESTNET_CollateralConfig_proxy_ADDRESS=0x27c3735c1996eaD0932C244659aE857826b2a57A


TESTNET_mAmMMF_proxy_ADDRESS=0x5142Df9767B2A28e1356953718E4bc47D0B3E2B1


# ==============================================================================cash+
# PlusFund 结构登记从此处开始；上方为通用地址和多签记录。
## hashkey testnet cash+
### HASHKEY_TESTNET_CASH_PROXY_ADDRESS=0x40fc7a4Dfcade4021946f028f6fCf43666110847  # [旧结构 / stoken1.0；测试网，不计正式统计]
### HASHKEY_TESTNET_USDC_PROXY_ADDRESS=0x703A0B94A49F765107e3e4abEB4FC3E5bac7248f  # [非 PlusFund；配套测试币地址，结构不适用]


## BNBT (BSC Testnet) cash+
## https://testnet.bscscan.com/address/0x4013361546efe989Efd4a1242aDD5Ea88915e980
### BNBT_CASH_PROXY_ADDRESS=0x4013361546efe989Efd4a1242aDD5Ea88915e980  # [旧结构 / stoken1.0；测试网，不计正式统计]
### BNBT_CASH_TIMELOCK_ADDRESS=0xAD4fb34AA2d4AF3B55b15EFB807222B565361D1b  # [旧结构关联 Timelock；仅见于 feature/stoken1.0 原始地址簿，代理关系待链上核实]
### BNBT_MOCK_USDT_ADDRESS=0x1afB66E33b75B146D91A68dbb7E64eeb21834b6a
### BNBT_CASH_STOKEN_ADMIN_SAFE=0x89B416C2e456b89bFDa314fb5C400BAB66D4aADb

## BSC (Binance Smart Chain) cash+
## https://bscscan.com/address/0x1775504c5873e179Ea2f8ABFcE3861EC74D159bc
### BSC_CASH_PROXY_ADDRESS=0x1775504c5873e179Ea2f8ABFcE3861EC74D159bc  # [旧结构 / stoken1.0]
### BSC_CASH_TIMELOCK_ADDRESS=0x93323EE2F4c3174E8A08ca39015C160AD308235A  # [旧结构关联 Timelock；仅见于 feature/stoken1.0 原始地址簿，代理关系待链上核实]
### BSC_CASH_PROXY_TEST_ADDRESS=0x048A8AFA8cF69EA53B72298d50033d1E2560b809  # [非 PlusFund；用途待核对，地址簿另标为 TESTNET_BlockList]

## ETH (Ethereum) cash+
## https://etherscan.io/address/0x498D9329555471bF6073A5f2D047F746d522A373
### ETH_CASH_PROXY_ADDRESS=0x498D9329555471bF6073A5f2D047F746d522A373  # [旧结构 / stoken1.0]
    
## Sepolia ETH (Ethereum) cash+ 
## https://sepolia.etherscan.io/address/0x734bb43B503Ea50EBE58EB371e34263551cc3d28
### SEPOLIA_ETH_CASH_PROXY_ADDRESS=0x734bb43B503Ea50EBE58EB371e34263551cc3d28  # [旧结构 / stoken1.0；测试网，不计正式统计]

## Avalanche Fuji Testnet
### AVALANCHE_FUJI_TESTNET_CASH_PROXY_ADDRESS=0x0D90a6eE85d5668734bb3A515147f53EBDfE866c  # [旧结构 / stoken1.0；测试网，不计正式统计]

## Pharos Private Mainnet  
### PHAROS_PRIVATE_MAINNET_CASH_PROXY_ADDRESS=0x0D90a6eE85d5668734bb3A515147f53EBDfE866c  # [旧结构 / stoken1.0]

# ==============================================================================cash+


# ==============================================================================cash+ 2.0
## BNBT (BSC Testnet) cash+ 2.0
## https://testnet.bscscan.com/address/0x9EA9cd205783F08700d2A12C325FC4e1BF8e99a2
### BNBT_CASH2_PROXY_ADDRESS=0x9EA9cd205783F08700d2A12C325FC4e1BF8e99a2  # [新结构 / main；测试网，不计正式统计]

## Sepolia ETH (Ethereum) cash+ 2.0 
## https://sepolia.etherscan.io/address/0xbc0E5Af03b41FEB5ec5968Ddd324f3eC48017138
### SEPOLIA_ETH_CASH2_PROXY_ADDRESS=0xbc0E5Af03b41FEB5ec5968Ddd324f3eC48017138  # [新结构 / main；测试网，不计正式统计]

## Pharos cash+ 2.0 
## https://pharos.socialscan.io/address/0x907C00D587DaFf16D028fE1e131d6DD3c6BF2F4B
### PHAROS_MAINNET_CASH2_PROXY_ADDRESS=0x907C00D587DaFf16D028fE1e131d6DD3c6BF2F4B  # [新结构 / main]

## atlantic.pharos CASH+ 2.0
## https://atlantic.pharos.io/address/0x4013361546efe989Efd4a1242aDD5Ea88915e980
### ATLANTIC_PHAROS_CASH2_PROXY_ADDRESS=0x4013361546efe989Efd4a1242aDD5Ea88915e980  # [新结构 / main；测试网，不计正式统计]

# ==============================================================================cash+ 2.0


# ==============================================================================bond+
## hashkey mainnet bond+
### HASHKEY_MAINNET_BOND_PROXY_ADDRESS=0x0D90a6eE85d5668734bb3A515147f53EBDfE866c  # [旧结构 / stoken1.0]

## Avalanche mainnet bond+
### AVALANCHE_MAINNET_BOND_PROXY_ADDRESS=0x0D90a6eE85d5668734bb3A515147f53EBDfE866c  # [旧结构 / stoken1.0]

## BSC (Binance Smart Chain) bond+
### BSC_BOND_PROXY_ADDRESS=0xef663399110a76B3668e97fe697d721DCBb0c316  # [旧结构 / stoken1.0]

## Pharos Private Mainnet  
### PHAROS_PRIVATE_MAINNET_BOND_PROXY_ADDRESS=0xCd01A9197c71d844A2AFCEd2D2fD7102FBB3Fa83  # [旧结构 / stoken1.0]
# ==============================================================================bond+

# ==============================================================================bond+ 2.0
## Pharos bond+ 2.0
## https://pharos.socialscan.io/address/0x286D9F099587f567EcE2b70eBB64B94ACD672d76
### PHAROS_MAINNET_BOND2_PROXY_ADDRESS=0x286D9F099587f567EcE2b70eBB64B94ACD672d76  # [新结构 / main]

## plume bond+ 2.0
## https://explorer.plume.org/address/0x0D90a6eE85d5668734bb3A515147f53EBDfE866c
### PLUME_MAINNET_BOND2_PROXY_ADDRESS=0x0D90a6eE85d5668734bb3A515147f53EBDfE866c  # [新结构 / main]

## eth bond+ 2.0
## https://etherscan.io/address/0x28d77ea7c61cd9055983ef8b0806778d8bb12c88
### ETH_BOND2_PROXY_ADDRESS=0x28d77ea7c61cd9055983ef8b0806778d8bb12c88  # [新结构 / main]

# ==============================================================================bond+ 2.0

# ==============================================================================AMCASH
## BSC (Binance Smart Chain) AMCASH
## https://bscscan.com/address/0x0ba0443A7a2D4Bfeb44ec5C1234106CBc2557A91
### BSC_AMCASH_PROXY_ADDRESS=0x0ba0443A7a2D4Bfeb44ec5C1234106CBc2557A91  # [旧结构 / stoken1.0]

## ETH (Ethereum) AMCASH
## https://etherscan.io/address/0x212624EE086bF0A8393F3BE84F4e21f54372F8AF
### ETH_AMCASH_PROXY_ADDRESS=0x212624EE086bF0A8393F3BE84F4e21f54372F8AF  # [旧结构 / stoken1.0]
# ==============================================================================AMCASH


# ==============================================================================AMCASH+
## BSC (Binance Smart Chain) AMCASH+
## https://bscscan.com/address/0x1ec3AA07e3898f1e6d4F23b5dce1bdbecb5c1Fe1
### BSC_AMCASH+_PROXY_ADDRESS=0x1ec3AA07e3898f1e6d4F23b5dce1bdbecb5c1Fe1  # [旧结构 / stoken1.0]

## ETH (Ethereum) AMCASH+
## https://etherscan.io/address/0x78e80dA0616887b46A31F39310C2a8B0Fbd6A42d
### ETH_AMCASH+_PROXY_ADDRESS=0x78e80dA0616887b46A31F39310C2a8B0Fbd6A42d  # [旧结构 / stoken1.0]

# ==============================================================================AMCASH+


# ==============================================================================YIELD+ 2.0
## Pharos YIELD+ 2.0
## https://pharos.socialscan.io/address/0x87a1A531090bc58b34398E3cBa4C9b00c6B9231E
### PHAROS_MAINNET_YIELD2_PROXY_ADDRESS=0x87a1A531090bc58b34398E3cBa4C9b00c6B9231E  # [新结构 / main]

## plume YIELD+ 2.0
## https://explorer.plume.org/address/0xD9ffec462793e6627F223671E9C9b217C8103940
### PLUME_MAINNET_YIELD2_PROXY_ADDRESS=0xD9ffec462793e6627F223671E9C9b217C8103940  # [新结构 / main]

## ETH YIELD+ 2.0
## https://etherscan.io/address/0x37d03D8caBfB617e455D0cAA0Cf1cdc5b8F3BDEe
### ETH_YIELD2_PROXY_ADDRESS=0x37d03D8caBfB617e455D0cAA0Cf1cdc5b8F3BDEe  # [新结构 / Wallet getter已确认；storage validation PASS；源码版本标识待核]

## BSC YIELD+ 2.0
## https://bscscan.com/address/0xCCa4656F736490cf2155589aEcd8382765a3e691
### BSC_YIELD2_PROXY_ADDRESS=0xCCa4656F736490cf2155589aEcd8382765a3e691  # [新结构 / main]

# ==============================================================================YIELD+ 2.0

# ==============================================================================NGI+ 2.0
## Pharos NGI+ 2.0
## https://pharos.socialscan.io/address/0x85f51213A6c3F2566aF519D296BB75AD4EC6d234
### PHAROS_MAINNET_NGI2_PROXY_ADDRESS=0x85f51213A6c3F2566aF519D296BB75AD4EC6d234  # [新结构 / main]

## ETH NGI+ 2.0
## https://etherscan.io/address/0xF252C5BD43907a6CAb079E990845a37a7C5730d9
### ETH_NGI2_PROXY_ADDRESS=0xF252C5BD43907a6CAb079E990845a37a7C5730d9  # [新结构 / main]

## BSC NGI+ 2.0
## https://bscscan.com/address/0x50BF2924ceE59737EAD76e881643eD8569BAe6e8
### BSC_NGI2_PROXY_ADDRESS=0x50BF2924ceE59737EAD76e881643eD8569BAe6e8  # [新结构 / main]

# ==============================================================================NGI+ 2.0

# ==============================================================================PGNGI+ 2.0
# [main 分支独有产品登记：stoken1.0 地址簿未列出；链上 wallets(address) 已确认 Wallet 新结构，storage validation PASS；准确实现源码仍须核验]
## Pharos PGNGI+ 2.0
## https://pharos.socialscan.io/address/0x238Bd29Bc460F6cB56f80f99B2B39Ff2c183Ee4D
### PHAROS_MAINNET_PGNGI2_PROXY_ADDRESS=0x238Bd29Bc460F6cB56f80f99B2B39Ff2c183Ee4D (14578508)  # [新结构 / main；分支独有登记]

## ETH PGNGI+ 2.0
## https://etherscan.io/address/0x0e6fcE64D9e32ebF5D7cf3f6DEd501415EcA374c
### ETH_PGNGI2_PROXY_ADDRESS=0x0e6fcE64D9e32ebF5D7cf3f6DEd501415EcA374c (25710431)  # [新结构 / main；分支独有登记]

## BSC PGNGI+ 2.0
## https://bscscan.com/address/0x9d54F56e71923eBd0c61336916f91CFb3a3938C3
### BSC_PGNGI2_PROXY_ADDRESS=0x9d54F56e71923eBd0c61336916f91CFb3a3938C3 (114740865)  # [新结构 / main；分支独有登记]

## ARC PGNGI+ 2.0
## 0x0D90a6eE85d5668734bb3A515147f53EBDfE866c
### ARC_PGNGI2_PROXY_ADDRESS=0x0D90a6eE85d5668734bb3A515147f53EBDfE866c (20843712)  # [新结构 / main；分支独有登记]

# ==============================================================================PGNGI+ 2.0



# ==============================================================================EPOCH+ 2.0
## ETH EPOCH+ 2.0
## https://etherscan.io/address/0x3bE5dD4a34F1C6a112048b9dF908cED4372D5049
### ETH_EPOCH2_PROXY_ADDRESS=0x3bE5dD4a34F1C6a112048b9dF908cED4372D5049  # [新结构 / main]

# ==============================================================================EPOCH+ 2.0

# ==============================================================================CASHa+ 2.0
## ETH CASHa+ 2.0
## https://etherscan.io/address/0x907C00D587DaFf16D028fE1e131d6DD3c6BF2F4B
### ETH_CASHa2_PROXY_ADDRESS=0x907C00D587DaFf16D028fE1e131d6DD3c6BF2F4B  # [新结构 / main]

# ==============================================================================CASHa+ 2.0

# ==============================================================================CNCASH+ 2.0
## ETH CNCASH+ 2.0
## https://etherscan.io/address/0x286D9F099587f567EcE2b70eBB64B94ACD672d76
### ETH_CNCASH2_PROXY_ADDRESS=0x286D9F099587f567EcE2b70eBB64B94ACD672d76  # [新结构 / main]

# ==============================================================================CNCASH+ 2.0

# ==============================================================================GTCASH+ 3.0

## ETH GTCASH+ 3.0
## https://etherscan.io/address/0x63E19Fb814Eb737730ac0aFbb52B351695B97176
### ETH_GTCASH3_PROXY_ADDRESS=0x63E19Fb814Eb737730ac0aFbb52B351695B97176  # [新结构 / main]
### ETH_GTCASH3_TIMELOCK_ADDRESS=0x15cf9c4bdf3CC1b6743cc09E3F7C49B4f2043a56  # [新结构关联 Timelock / main；对应关系待链上核验]

# ==============================================================================GTCASH+ 3.0

# ==============================================================================HTCASH+ 3.0

## ETH HTCASH+ 3.0
## https://etherscan.io/address/0x50bDAFf4bCeB852F006F657f47C68fCC417f7bEb
### ETH_HTCASH3_PROXY_ADDRESS=0x50bDAFf4bCeB852F006F657f47C68fCC417f7bEb  # [新结构 / main]
### ETH_HTCASH3_TIMELOCK_ADDRESS=0x493127FB112d1d93F30F0525eD77978882A8eD91  # [新结构关联 Timelock / main；对应关系待链上核验]

# ==============================================================================HTCASH+ 3.0


# ==============================================================================mYIELD+ 3.0
# [新结构 / main；main 地址簿有登记而 stoken1.0 地址簿缺项。链上 Wallet getter 已确认且 storage validation PASS；准确源码版本仍须核验]

## BSC mYIELD+ 3.0
## https://bscscan.com/address/0xFb8cB7630BC3cb34a6A9846Ec03De3A32393Ee65
### BSC_MYIELD3_PROXY_ADDRESS=0xFb8cB7630BC3cb34a6A9846Ec03De3A32393Ee65  # [新结构 / main；分支独有登记]
### BSC_MYIELD3_TIMELOCK_ADDRESS=0x87a1A531090bc58b34398E3cBa4C9b00c6B9231E  # [新结构关联 Timelock / main；对应关系待链上核验]

## ETH mYIELD+ 3.0
## https://etherscan.io/address/0xf3a2a5de306b063D75C86B6352832639b7263a3B
### ETH_MYIELD3_PROXY_ADDRESS=0xf3a2a5de306b063D75C86B6352832639b7263a3B  # [新结构 / main；分支独有登记]
### ETH_MYIELD3_TIMELOCK_ADDRESS=0x6b687fBBca04b21a4541b1a8CC319f407EA85eE1  # [新结构关联 Timelock / main；对应关系待链上核验]

# ==============================================================================mYIELD+ 3.0

# ==============================================================================GFCASH+ 3.0
# [新结构 / main；main 地址簿有登记而 stoken1.0 地址簿缺项。链上 Wallet getter 已确认且 storage validation PASS；准确源码版本仍须核验]

## ETH GFCASH+ 3.0
## https://etherscan.io/address/0x46c8055eD9D3c7DF3f515EE6Cd4a5b8616156719
### ETH_GFCASH3_PROXY_ADDRESS=0x46c8055eD9D3c7DF3f515EE6Cd4a5b8616156719  # [新结构 / main；分支独有登记]

# ==============================================================================GFCASH+ 3.0

# ==============================================================================TKCASH+ 3.0
# [新结构 / main；main 地址簿有登记而 stoken1.0 地址簿缺项。链上 Wallet getter 已确认且 storage validation PASS；准确源码版本仍须核验]

## ETH TKCASH+ 3.0
## https://etherscan.io/address/0x257c71ecDB944EC09780c97e874ED41e98E00913
### ETH_TKCASH3_PROXY_ADDRESS=0x257c71ecDB944EC09780c97e874ED41e98E00913  # [新结构 / main；分支独有登记]

# ==============================================================================TKCASH+ 3.0
