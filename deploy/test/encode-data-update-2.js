const { ethers, upgrades } = require("hardhat");

async function main() {
  // ===== 你要改的参数 =====
  const proxyAddress = "0x85f51213A6c3F2566aF519D296BB75AD4EC6d234";
  const timelockAddress = "0x9b61Cc9DcAd897Dc6d1750DF5c3db00F9eC68379";
  const newImplementationAddress = "0x015D163e73D59eA8eBA4d34DdabB363C4D73C6e1";
  // 如果升级后要顺便执行 reinitializer，就打开下面两行
  const callInitializer = false;
  const initializerArgs = []; // 例如 [123, "abc"]

  const hre = require("hardhat");
  const { name: networkName } = hre.network;
  const [deployer] = await hre.ethers.getSigners();
  const deployerAddress = deployer.address;
  console.log(`正在部署到网络: ${networkName}`);
  console.log(`部署者地址: ${deployerAddress}`);

  const proxyAsUUPS = await ethers.getContractAt(
    [
      "function upgradeToAndCall(address newImplementation, bytes data) external payable",
    ],
    proxyAddress,
  );

  let upgradeCallData;
  if (callInitializer) {
    const implementation = await ethers.getContractAt(
      "PlusFund",
      newImplementationAddress,
    );
    const initData = implementation.interface.encodeFunctionData(
      "initializeV2",
      initializerArgs,
    );

    upgradeCallData = proxyAsUUPS.interface.encodeFunctionData(
      "upgradeToAndCall",
      [newImplementationAddress, initData],
    );
  } else {
    upgradeCallData = proxyAsUUPS.interface.encodeFunctionData(
      "upgradeToAndCall",
      [newImplementationAddress, "0x"],
    );
  }

  const timelock = await ethers.getContractAt(
    "TimelockController",
    timelockAddress,
  );

  const predecessor = ethers.ZeroHash;
  const salt = ethers.ZeroHash;
  const operationId = await timelock.hashOperation(
    proxyAddress,
    0,
    upgradeCallData,
    predecessor,
    salt,
  );
  const cancelData = timelock.interface.encodeFunctionData("cancel", [
    operationId,
  ]);

  // ② 再编码 timelock.schedule() 调用
  const scheduleData = timelock.interface.encodeFunctionData("schedule", [
    proxyAddress, // target
    0, // value（不带 ETH）
    upgradeCallData, // data → 实际要调用的方法
    predecessor, // predecessor（无前置操作）
    salt, // salt（随机数，避免重复）
    172800,
  ]);

  const executeData = timelock.interface.encodeFunctionData("execute", [
    proxyAddress, // target
    0, // value（不带 ETH）
    upgradeCallData, // data → 实际要调用的方法
    predecessor, // predecessor（无前置操作）
    salt, // salt（随机数，避免重复）
  ]);

  console.log("多签需要执行的交易:");
  console.log("To:                  ", timelockAddress);
  console.log("Value:               ", 0);
  console.log("Schedule Data:       ", scheduleData);
  console.log("");
  console.log("Execute Data:        ", executeData);
  console.log("");
  console.log("Cancel Data:         ", cancelData);
  console.log("Upgrade Call Data:   ", upgradeCallData);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

// npx hardhat run .\deploy\test\encode-data-update-2.js --network bsc
