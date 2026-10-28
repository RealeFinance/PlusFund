const { ethers, upgrades } = require("hardhat");

const ETHTokenAddresses = [
  "0xdac17f958d2ee523a2206206994597c13d831ec7",
  "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
];

const BSCTokenAddresses = [
  "0x55d398326f99059ff775485246999027b3197955",
  "0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d",
];

const PharosTokenAddresses = [
  "0x52c48d4213107b20bc583832b0d951fb9ca8f0b0",
  "0x7126c3fef4e6a680eee09fb039b2236f638384b0",
  "0x51e2A24742Db77604B881d6781Ee16B5b8fcBE29",
];

async function main() {
  // ===== 你要改的参数 =====
  const contractName = "PlusFund";
  const PRODUCT_NAME = "PGIPPlus";
  const name = "PGIPPlus";
  const symbol = "PGIP+";
  const timelockDelay = 172800; // 2 天（秒）
  const data = {
    // ===== Timelock 配置 =====
    // DEFAULT_ADMIN_ROLE 會交给 TimelockController，所有敏感操作延迟执行
    timelock: {
      enabled: true,
      minDelay: timelockDelay, // 2 天（秒）
      proposers: ["0x37A259246d6AA0842C2e4564EF219CE462B6e2aA"], // 可发起提案的地址
      executors: ["0x0000000000000000000000000000000000000000"], // 放空则延迟到后任何人可执行
      cancellers: ["0x37A259246d6AA0842C2e4564EF219CE462B6e2aA"], // 可取消待执行提案的地址
    },
    // ===== 角色分配 =====
    PLUSFUND_ADMIN: ["0x7419896e4198b259bbc1C02e4AC94792B64C1c45"], // 日常运维地址（无延迟）
    // ===== 资产地址 =====
    assetRecipient: "0xc76683E89c61Da7F479db543a591CEE00353644D",
    assetSender: "0xc76683E89c61Da7F479db543a591CEE00353644D",
    serviceFeeRecipient: "0xc76683E89c61Da7F479db543a591CEE00353644D",
    // ===== 支持代币 =====
    // supportedTokenAddresses: [...ETHTokenAddresses],
    supportedTokenAddresses: ["0xbA9986D2381edf1DA03B0B9c1f8b00dc4AacC369", "0x3A337a6adA9d885b6Ad95ec48F9b75f197b5AE35"],
    minSubscriptionAmount: 100000,
    minRedemptionAmount: "1000000000000000000"
  };
  // =======================

  const hre = require("hardhat");
  const { name: networkName } = hre.network;
  const [deployer] = await hre.ethers.getSigners();
  console.log(`正在部署到网络: ${networkName}`);
  console.log(`部署者地址: ${deployer.address}`);
  const deployerAddress = deployer.address;

  const Contract = await ethers.getContractFactory(contractName);
  const proxy2 = await upgrades.deployProxy(Contract, [name, symbol], {
    initializer: "initialize",
    gasLimit: 15000000,
    timeout: 0,
    pollingInterval: 10000,
  });
  await proxy2.waitForDeployment();
  const deploymentTx = proxy2.deploymentTransaction();
  if (!deploymentTx) {
    throw new Error("Proxy deployment transaction is unavailable.");
  }
  const deploymentReceipt = await deploymentTx.wait();
  const blockNumber = deploymentReceipt.blockNumber;

  // 获取代理合约实例
  // const proxy2 = await ethers.getContractAt(
  //   contractName,
  //   "0x50bDAFf4bCeB852F006F657f47C68fCC417f7bEb",
  // );

  const tokenAddress = await proxy2.getAddress();
  console.log(`${contractName} Token 地址:`, tokenAddress);

  console.log(`开始设置权限...`);
  // ===== 部署 TimelockController =====
  let timelockAddress;
  if (data.timelock?.enabled) {
    console.log(`正在部署 TimelockController...`);
    const TimelockController = await ethers.getContractFactory(
      "TimelockController",
    );
    const timelock = await TimelockController.deploy(
      data.timelock.minDelay,
      data.timelock.proposers,
      data.timelock.executors,
      deployerAddress, // 暂时设 deployer 为 admin，配置完成后再放弃
    );
    await timelock.waitForDeployment();
    timelockAddress = await timelock.getAddress();
    console.log(`TimelockController 地址: ${timelockAddress}`);

    // 将 DEFAULT_ADMIN_ROLE 交给 TimelockController
    console.log(`正在授予 DEFAULT_ADMIN_ROLE 给 Timelock...`);
    const txGrant = await proxy2.grantRole(ethers.ZeroHash, timelockAddress);
    await txGrant.wait();
    console.log(`DEFAULT_ADMIN_ROLE 已授予给 Timelock`);

    // 构造函数已经设置了 PROPOSER 和 EXECUTOR，这里只需要单独配置 CANCELLER
    const CANCELLER_ROLE = await timelock.CANCELLER_ROLE();
    for (const addr of data.timelock.cancellers ?? []) {
      const tx = await timelock.grantRole(CANCELLER_ROLE, addr);
      await tx.wait();
      console.log(`CANCELLER_ROLE 已授予: ${addr}`);
    }

    // 放弃 deployer 在 Timelock 中的 admin 身份
    const txRenounceTimelock = await timelock.renounceRole(
      ethers.ZeroHash,
      deployerAddress,
    );
    await txRenounceTimelock.wait();
    console.log(`Timelock admin 已放弃`);

    console.log(`TimelockController 配置完成`);
  } else {
    // 不用 timelock，直接授予 DEFAULT_ADMIN_ROLE 给指定地址
    for (const admin of data.DEFAULT_ADMIN_ROLE ?? []) {
      console.log(`正在授权 DEFAULT_ADMIN_ROLE: ${admin}`);
      const tx = await proxy2.grantRole(ethers.ZeroHash, admin);
      await tx.wait();
      console.log(`DEFAULT_ADMIN_ROLE权限已授予: ${admin}`);
    }
  }
  const plusFundAdminRole = await proxy2.PLUSFUND_ADMIN();
  for (const admin of data.PLUSFUND_ADMIN ?? []) {
    console.log(`正在授权 PLUSFUND_ADMIN: ${admin}`);
    const tx = await proxy2.grantRole(plusFundAdminRole, admin);
    await tx.wait();
    console.log(`PLUSFUND_ADMIN权限已授予: ${admin}`);
  }

  const tx = await proxy2.grantRole(plusFundAdminRole, deployerAddress);
  await tx.wait();
  console.log(`PLUSFUND_ADMIN权限已授予: ${deployerAddress}`);

  const txMinSubscription = await proxy2.setMinSubscriptionAmount(
    data.minSubscriptionAmount,
  );
  await txMinSubscription.wait();
  console.log(`最小申购金额已设置: ${data.minSubscriptionAmount}`);

  const txMinRedemption = await proxy2.setMinRedemptionAmount(
    data.minRedemptionAmount,
  );
  await txMinRedemption.wait();
  console.log(`最小赎回金额已设置: ${data.minRedemptionAmount}`);

  const actualMinSubscription = await proxy2.MIN_SUBSCRIPTION_USD_AMOUNT();
  const actualMinRedemption = await proxy2.MIN_REDEMPTION_CASH_AMOUNT();
  if (actualMinSubscription !== BigInt(data.minSubscriptionAmount)) {
    throw new Error(
      `最小申购金额核验失败: expected ${data.minSubscriptionAmount}, got ${actualMinSubscription}`,
    );
  }
  if (actualMinRedemption !== BigInt(data.minRedemptionAmount)) {
    throw new Error(
      `最小赎回金额核验失败: expected ${data.minRedemptionAmount}, got ${actualMinRedemption}`,
    );
  }
  console.log("最小申购和最小赎回金额读回核验通过");

  const tx1 = await proxy2.setAssetRecipient(data.assetRecipient);
  await tx1.wait();
  console.log(`资产接收地址已设置: ${data.assetRecipient}`);

  const tx2 = await proxy2.setAssetSender(data.assetSender);
  await tx2.wait();
  console.log(`资产发送地址已设置: ${data.assetSender}`);

  const tx3 = await proxy2.setServiceFeeRecipient(data.serviceFeeRecipient);
  await tx3.wait();
  console.log(`服务费接收地址已设置: ${data.serviceFeeRecipient}`);

  const expectedFundAccounts = {
    assetRecipient: data.assetRecipient,
    assetSender: data.assetSender,
    serviceFeeRecipient: data.serviceFeeRecipient,
  };
  for (const [getter, expected] of Object.entries(expectedFundAccounts)) {
    const actual = await proxy2[getter]();
    if (actual.toLowerCase() !== expected.toLowerCase()) {
      throw new Error(
        `资金账户核验失败 ${getter}: expected ${expected}, got ${actual}`,
      );
    }
  }
  console.log("三个资金账户读回核验通过");

  for (const address of data.supportedTokenAddresses ?? []) {
    console.log(`正在添加支持代币: ${address}`);
    const tx = await proxy2.addSupportedTokenAddress(address);
    await tx.wait();
    console.log(`支持代币已添加: ${address}`);
  }

  console.log(
    `支持的交易代币地址已设置: ${(data.supportedTokenAddresses ?? []).join(
      ", ",
    )}`,
  );

  // ===== 部署者退出部分权限（DEFAULT_ADMIN_ROLE 单独处理） =====
  // 先自动退出 PLUSFUND_ADMIN 和 PLUSFUND_BLACKLIST_ADMIN_ROLE
  console.log(`开始撤销部署者权限...`);
  const rolesToRenounce = [
    plusFundAdminRole,
    await proxy2.PLUSFUND_BLACKLIST_ADMIN_ROLE(),
  ];
  for (const role of rolesToRenounce) {
    const hasRole = await proxy2.hasRole(role, deployerAddress);
    if (hasRole) {
      console.log(`正在退出: ${role}`);
      const tx = await proxy2.renounceRole(role, deployerAddress);
      await tx.wait();
      console.log(`已退出: ${role}`);
    } else {
      console.log(`已无此角色，跳过: ${role}`);
    }
  }
  console.log(`部署者 PLUSFUND_ADMIN 和 PLUSFUND_BLACKLIST_ADMIN_ROLE 已退出`);

  // ===== DEFAULT_ADMIN_ROLE 单独退出（可选执行） =====
  // 如果需要退出 DEFAULT_ADMIN_ROLE，取消下面的注释
  // 警告: 确保 Timelock 或其他人已经持有 DEFAULT_ADMIN_ROLE，否则退出后无人能管理合约！
  if (data.timelock?.enabled) {
    const hasTimelockDefaultAdmin = await proxy2.hasRole(
      ethers.ZeroHash,
      timelockAddress,
    );
    const defaultAdminCount = await proxy2.getRoleMemberCount(ethers.ZeroHash);
    if (!hasTimelockDefaultAdmin || defaultAdminCount < 2n) {
      throw new Error(
        "Timelock must hold DEFAULT_ADMIN_ROLE before deployer renounces it.",
      );
    }

    await (await proxy2.renounceRole(ethers.ZeroHash, deployerAddress)).wait();
    if (await proxy2.hasRole(ethers.ZeroHash, deployerAddress)) {
      throw new Error(
        "Deployer still has DEFAULT_ADMIN_ROLE after renouncing it.",
      );
    }
    console.log("Deployer renounced DEFAULT_ADMIN_ROLE.");
  }

  console.log(`PRODUCT_NAME=${PRODUCT_NAME}`);
  console.log(`plusfund_Contract_Address=${tokenAddress}`);
  console.log(`plusfund_Start_Height=${blockNumber}`);
}

main().catch(console.error);

// npx hardhat run deploy/test/_deploy_PlusFund.js --network bscTestnet

// ====== 多签调用timelock示例 ======

// 假设你有 PlusFund 和 Timelock 的 interface
// const plusFundInterface = new ethers.Interface([
//   "function setAssetRecipient(address newRecipient)"
// ]);
// const timelockInterface = new ethers.Interface([
//   "function schedule(address target, uint256 value, bytes data, bytes32 predecessor, bytes32 salt, uint256 delay)",
//   "function execute(address target, uint256 value, bytes data, bytes32 predecessor, bytes32 salt)"
// ]);

// // ① 先把实际要调用的 PlusFund 方法编码
// const setAssetRecipientData = plusFundInterface.encodeFunctionData("setAssetRecipient", [
//   "0x新地址"
// ]);

// // ② 再编码 timelock.schedule() 调用
// const scheduleData = timelockInterface.encodeFunctionData("schedule", [
//   "0xPlusFund代理地址", // target
//   0, // value（不带 ETH）
//   setAssetRecipientData, // data → 实际要调用的方法
//   ethers.ZeroHash, // predecessor（无前置操作）
//   ethers.ZeroHash, // salt（随机数，避免重复）
//   timelockDelay, // delay（2 天）
// ]);

// console.log("多签需要执行的交易:");
// console.log("To:      ", "0xTimelock地址");
// console.log("Value:   ", 0);
// console.log("Data:    ", scheduleData);
// 把这 3 个参数填到多签钱包的"发送交易"页面
