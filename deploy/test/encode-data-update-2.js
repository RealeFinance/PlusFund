const { ethers, upgrades } = require("hardhat");

async function main() {
  // ===== 你要改的参数 =====
  const proxyAddress = "0x238Bd29Bc460F6cB56f80f99B2B39Ff2c183Ee4D";
  const timelockAddress = "0xbfc85c81133D74519cc09Bf558D51D9628850E67";
  const newImplementationAddress = "0xB52DED00A3E73AfBa495d31Bb6f38C6a5DD43B31";
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
    // 假设你的 V2 里有：
    // function initializeV2(uint256 x, string memory y) reinitializer(2)
    const implInterface = NewImplFactory.interface;
    const initData = implInterface.encodeFunctionData(
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
