const { ethers, upgrades } = require("hardhat");

async function main() {
  // ===== 你要改的参数 =====
  const proxyAddress = "0x238Bd29Bc460F6cB56f80f99B2B39Ff2c183Ee4D";
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
