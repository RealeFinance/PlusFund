const { ethers, upgrades } = require("hardhat");

async function main() {
  // ===== 你要改的参数 =====
  const proxyAddress = "0x0D90a6eE85d5668734bb3A515147f53EBDfE866c";
  const contractName = "PlusFund";

  const hre = require("hardhat");
  const { name: networkName } = hre.network;
  const [deployer] = await hre.ethers.getSigners();
  const deployerAddress = deployer.address;
  console.log(`正在部署到网络: ${networkName}`);
  console.log(`部署者地址: ${deployerAddress}`);

  // ===== 1) 获取新实现合约工厂 =====
  const NewImplFactory = await ethers.getContractFactory(contractName);

  // ===== 2) 校验升级安全性 =====
  await upgrades.validateUpgrade(proxyAddress, NewImplFactory, {
    kind: "uups",
  });
  // ===== 3) 仅部署新的 implementation，不执行升级 =====
  const newImplementationAddress = await upgrades.prepareUpgrade(
    proxyAddress,
    NewImplFactory,
    {
      kind: "uups",
    },
  );
  console.log("New implementation deployed:", newImplementationAddress);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

// npx hardhat run .\deploy\test\encode-data-update-1.js --network bscTestnet
