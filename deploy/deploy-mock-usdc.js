const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

const { ethers } = hre;

function jsonReplacer(_, value) {
  return typeof value === "bigint" ? value.toString() : value;
}

async function main() {
  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();

  console.log(`Network: ${hre.network.name}`);
  console.log(`Deployer: ${deployer.address}`);

  const MockUSDC = await ethers.getContractFactory("MockUSDC", deployer);
  const mockUSDC = await MockUSDC.deploy();
  await mockUSDC.waitForDeployment();

  const address = await mockUSDC.getAddress();
  const deploymentTransaction = mockUSDC.deploymentTransaction();
  const decimals = await mockUSDC.decimals();

  const manifest = {
    contract: "MockUSDC",
    network: hre.network.name,
    chainId: network.chainId,
    deployer: deployer.address,
    address,
    deploymentTransaction: deploymentTransaction?.hash || null,
    name: await mockUSDC.name(),
    symbol: await mockUSDC.symbol(),
    decimals,
    mintRequiresPermission: false,
  };

  const outputPath = path.resolve(
    "deployments",
    `mock-usdc-${hre.network.name}.json`,
  );
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(
    outputPath,
    `${JSON.stringify(manifest, jsonReplacer, 2)}\n`,
    "utf8",
  );

  console.log(`MockUSDC deployed to: ${address}`);
  console.log(`Name: ${manifest.name}`);
  console.log(`Symbol: ${manifest.symbol}`);
  console.log(`Decimals: ${decimals}`);
  console.log("Mint permission: unrestricted");
  console.log(`Deployment manifest written to: ${outputPath}`);
}

main().catch((error) => {
  console.error(error.stack || error.message || error);
  process.exitCode = 1;
});


// npx hardhat run deploy/deploy-mock-usdc.js --network bscTestnet