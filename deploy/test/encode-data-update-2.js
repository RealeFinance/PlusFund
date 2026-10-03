const { ethers, upgrades } = require("hardhat");

async function main() {
  // ===== 你要改的参数 =====
  const proxyAddress = "0x919A61d30370B1f527a4026d5402CA9901C91a4b";
  const timelockAddress = "0xf863AEA90E62853d1137736c6407dFFf2440C476";
  const newImplementationAddress = "0x68C4061e26EAbf2EF0961Cd77a6AE1DD5053459E";
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

  const cancelData = timelock.interface.encodeFunctionData(
    "cancel",
    ["0x3172fc05fc1de7cd465b46402980628ab944c3f60cbadac923f11ac9978f0eab"], // 新的费率值
  );

  // ② 再编码 timelock.schedule() 调用
  const scheduleData = timelock.interface.encodeFunctionData("schedule", [
    proxyAddress, // target
    0, // value（不带 ETH）
    upgradeCallData, // data → 实际要调用的方法
    ethers.ZeroHash, // predecessor（无前置操作）
    ethers.ZeroHash, // salt（随机数，避免重复）
    120,
  ]);

  const executeData = timelock.interface.encodeFunctionData("execute", [
    proxyAddress, // target
    0, // value（不带 ETH）
    upgradeCallData, // data → 实际要调用的方法
    ethers.ZeroHash, // predecessor（无前置操作）
    ethers.ZeroHash, // salt（随机数，避免重复）
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

// npx hardhat run .\deploy\test\encode-data-update-2.js --network bscTestnet
