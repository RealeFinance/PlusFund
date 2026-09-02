const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

const { ethers } = hre;

const MIN_TIMELOCK_DELAY = 48n * 60n * 60n;

// ======== 部署参数：请在运行脚本前直接修改这里 ========
const DEPLOYMENT_CONFIG = {
  // 首次部署工厂时填写；连接已有工厂时可留空。
  factoryAdminSafe: "0x89B416C2e456b89bFDa314fb5C400BAB66D4aADb",
  operatorAddress: "0x9732bD08452aFB792884308674248d7bD2c3364f",

  // 留空则自动部署新的 PlusFund implementation。
  implementationAddress: "",

  // 首次部署留空；继续部署 Token 时填写已部署的工厂地址。
  factoryAddress: "",

  // false：只部署 implementation + factory；
  // true：在 poolAdmin 白名单已配置后继续部署 Token。
  deployToken: false,

  outputPath: "",

  token: {
    productIdText: "RWA-USDC-001",
    saltText: "RWA-USDC-001-v1",
    name: "Example RWA Token",
    symbol: "ERWA",
    stokenAdmin: "",
    poolAdmin: ethers.ZeroAddress,
    blacklistAdmin: ethers.ZeroAddress,
    ccipAdmin: ethers.ZeroAddress,
    assetRecipient: "",
    assetSender: "",
    serviceFeeRecipient: "",
    supportedTokens: [],
    minSubscriptionAmount: "0",
    minRedemptionAmount: "0",
    maxQueueLength: "100",
    timelockDelay: MIN_TIMELOCK_DELAY.toString(),
    proposers: [],
    executors: [],
    cancellers: [],
  },
};

function parseUint(value, name) {
  if (value === undefined || value === null || value === "") {
    throw new Error(`Missing numeric value: ${name}`);
  }
  try {
    return BigInt(value);
  } catch {
    throw new Error(`Invalid numeric value: ${name}`);
  }
}

function normalizeAddress(value, name, allowZero = false) {
  if (!value) {
    if (allowZero) return ethers.ZeroAddress;
    throw new Error(`Missing address: ${name}`);
  }
  const address = ethers.getAddress(value);
  if (!allowZero && address === ethers.ZeroAddress) {
    throw new Error(`${name} cannot be the zero address`);
  }
  return address;
}

function loadTokenConfig() {
  const raw = DEPLOYMENT_CONFIG.token;

  const productId = raw.productId || (raw.productIdText ? ethers.id(raw.productIdText) : null);
  const salt = raw.salt || (raw.saltText ? ethers.id(raw.saltText) : null);
  if (!productId || !ethers.isHexString(productId, 32)) {
    throw new Error("productId or productIdText must resolve to bytes32");
  }
  if (!salt || !ethers.isHexString(salt, 32)) {
    throw new Error("salt or saltText must resolve to bytes32");
  }

  const proposers = (raw.proposers || []).map((value, index) =>
    normalizeAddress(value, `proposers[${index}]`),
  );
  const executors = (raw.executors || []).map((value, index) =>
    normalizeAddress(value, `executors[${index}]`, true),
  );
  const cancellers = (raw.cancellers || []).map((value, index) =>
    normalizeAddress(value, `cancellers[${index}]`),
  );

  const config = {
    productId,
    name: requiredField(raw.name, "name"),
    symbol: requiredField(raw.symbol, "symbol"),
    stokenAdmin: normalizeAddress(raw.stokenAdmin, "stokenAdmin"),
    poolAdmin: normalizeAddress(raw.poolAdmin, "poolAdmin", true),
    blacklistAdmin: normalizeAddress(raw.blacklistAdmin, "blacklistAdmin", true),
    ccipAdmin: normalizeAddress(raw.ccipAdmin, "ccipAdmin", true),
    assetRecipient: normalizeAddress(raw.assetRecipient, "assetRecipient"),
    assetSender: normalizeAddress(raw.assetSender, "assetSender"),
    serviceFeeRecipient: normalizeAddress(
      raw.serviceFeeRecipient,
      "serviceFeeRecipient",
    ),
    supportedTokens: (raw.supportedTokens || []).map((value, index) =>
      normalizeAddress(value, `supportedTokens[${index}]`),
    ),
    minSubscriptionAmount: parseUint(
      raw.minSubscriptionAmount ?? 0,
      "minSubscriptionAmount",
    ),
    minRedemptionAmount: parseUint(
      raw.minRedemptionAmount ?? 0,
      "minRedemptionAmount",
    ),
    maxQueueLength: parseUint(raw.maxQueueLength ?? 0, "maxQueueLength"),
    timelockDelay: parseUint(
      raw.timelockDelay ?? MIN_TIMELOCK_DELAY,
      "timelockDelay",
    ),
    proposers,
    executors,
    cancellers,
  };

  if (config.timelockDelay < MIN_TIMELOCK_DELAY) {
    throw new Error("timelockDelay must be at least 48 hours");
  }
  if (config.proposers.length === 0 || config.executors.length === 0) {
    throw new Error("proposers and executors must not be empty");
  }

  return { config, salt };
}

function requiredField(value, name) {
  if (value === undefined || value === null || value === "") {
    throw new Error(`Missing field: ${name}`);
  }
  return value;
}

function parseDeploymentLog(factory, receipt, eventName) {
  for (const log of receipt.logs) {
    try {
      const parsed = factory.interface.parseLog(log);
      if (parsed && parsed.name === eventName) return parsed;
    } catch {
      // Ignore logs emitted by other contracts in the transaction.
    }
  }
  return null;
}

function jsonReplacer(_, value) {
  return typeof value === "bigint" ? value.toString() : value;
}

function writeManifest(manifest) {
  const outputPath = DEPLOYMENT_CONFIG.outputPath ||
    path.join("deployments", `plusfund-factory-${hre.network.name}.json`);
  const absolutePath = path.resolve(outputPath);
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
  fs.writeFileSync(
    absolutePath,
    `${JSON.stringify(manifest, jsonReplacer, 2)}\n`,
    "utf8",
  );
  console.log(`Deployment manifest written to ${absolutePath}`);
}

function printSafeApproval(factoryAddress, poolAdmin, factory) {
  const data = factory.interface.encodeFunctionData("setPoolAdminApproval", [
    poolAdmin,
    true,
  ]);
  console.log("\nPool admin whitelist approval must be executed by factoryAdminSafe:");
  console.log(JSON.stringify({
    to: factoryAddress,
    value: "0",
    data,
  }, null, 2));
}

async function deployImplementation() {
  if (DEPLOYMENT_CONFIG.implementationAddress) {
    return normalizeAddress(
      DEPLOYMENT_CONFIG.implementationAddress,
      "IMPLEMENTATION_ADDRESS",
    );
  }

  const Implementation = await ethers.getContractFactory("PlusFund");
  const implementation = await Implementation.deploy();
  await implementation.waitForDeployment();
  console.log(`PlusFund implementation: ${await implementation.getAddress()}`);
  return implementation.getAddress();
}

async function deployFactory(deployer, implementationAddress) {
  if (DEPLOYMENT_CONFIG.factoryAddress) {
    return {
      address: normalizeAddress(DEPLOYMENT_CONFIG.factoryAddress, "FACTORY_ADDRESS"),
      deployed: false,
    };
  }

  const factoryAdminSafe = normalizeAddress(
    DEPLOYMENT_CONFIG.factoryAdminSafe,
    "FACTORY_ADMIN_SAFE",
  );
  const operatorAddress = normalizeAddress(
    DEPLOYMENT_CONFIG.operatorAddress || deployer.address,
    "OPERATOR_ADDRESS",
  );
  if (factoryAdminSafe === operatorAddress) {
    throw new Error("FACTORY_ADMIN_SAFE and OPERATOR_ADDRESS must be different");
  }
  if ((await ethers.provider.getCode(factoryAdminSafe)) === "0x") {
    throw new Error("FACTORY_ADMIN_SAFE must be a deployed contract");
  }

  const Factory = await ethers.getContractFactory("PlusFundFactory");
  const factory = await Factory.deploy(
    implementationAddress,
    factoryAdminSafe,
    operatorAddress,
  );
  await factory.waitForDeployment();
  console.log(`PlusFundFactory: ${await factory.getAddress()}`);
  console.log(`Factory admin: ${factoryAdminSafe}`);
  console.log(`Factory operator: ${operatorAddress}`);

  return {
    address: await factory.getAddress(),
    deployed: true,
    factoryAdminSafe,
    operatorAddress,
    deploymentTransaction: factory.deploymentTransaction()?.hash || null,
  };
}

async function deployToken(factory, deployer, tokenConfig, salt) {
  const deployerRole = await factory.DEPLOYER_ROLE();
  if (!(await factory.hasRole(deployerRole, deployer.address))) {
    throw new Error(
      `The signing account ${deployer.address} does not have DEPLOYER_ROLE`,
    );
  }

  if (tokenConfig.poolAdmin !== ethers.ZeroAddress) {
    const approved = await factory.approvedPoolAdmins(tokenConfig.poolAdmin);
    if (!approved) {
      printSafeApproval(
        await factory.getAddress(),
        tokenConfig.poolAdmin,
        factory,
      );
      throw new Error(
        "poolAdmin is not approved; execute the Safe transaction above, then rerun with FACTORY_ADDRESS",
      );
    }
  }

  const predicted = await factory.predictTokenAddress(
    salt,
    tokenConfig.name,
    tokenConfig.symbol,
  );
  console.log(`Predicted Token proxy: ${predicted}`);

  const tx = await factory.deployToken(tokenConfig, salt);
  const receipt = await tx.wait();
  const deployedEvent = parseDeploymentLog(factory, receipt, "TokenDeployed");
  if (!deployedEvent) throw new Error("TokenDeployed event not found");

  const proxy = deployedEvent.args.proxy;
  const timelock = deployedEvent.args.timelock;
  const token = await ethers.getContractAt("PlusFund", proxy);

  const defaultAdminRole = await token.DEFAULT_ADMIN_ROLE();
  const stokenAdminRole = await token.STOKEN_ADMIN();
  const poolAdminRole = await token.POOL_ADMIN_ROLE();
  const timelockAdmin = await token.hasRole(defaultAdminRole, timelock);
  const stokenAdminGranted = await token.hasRole(
    stokenAdminRole,
    tokenConfig.stokenAdmin,
  );
  const poolAdminGranted = tokenConfig.poolAdmin === ethers.ZeroAddress
    ? true
    : await token.hasRole(poolAdminRole, tokenConfig.poolAdmin);

  if (!timelockAdmin || !stokenAdminGranted || !poolAdminGranted) {
    throw new Error("Post-deployment role verification failed");
  }

  console.log(`Token proxy: ${proxy}`);
  console.log(`Token Timelock: ${timelock}`);
  console.log("Post-deployment role verification: passed");

  return {
    productId: tokenConfig.productId,
    salt,
    proxy,
    timelock,
    transactionHash: receipt.hash,
    predictedProxy: predicted,
  };
}

async function main() {
  const [deployer] = await ethers.getSigners();
  const implementationAddress = DEPLOYMENT_CONFIG.factoryAddress
    ? (DEPLOYMENT_CONFIG.implementationAddress
      ? normalizeAddress(DEPLOYMENT_CONFIG.implementationAddress, "IMPLEMENTATION_ADDRESS")
      : null)
    : await deployImplementation();
  const factoryInfo = await deployFactory(deployer, implementationAddress);
  const factory = await ethers.getContractAt(
    "PlusFundFactory",
    factoryInfo.address,
    deployer,
  );
  const network = await ethers.provider.getNetwork();
  const manifest = {
    network: hre.network.name,
    chainId: network.chainId,
    deployer: deployer.address,
    implementation: implementationAddress,
    factory: factoryInfo,
  };

  try {
    if (DEPLOYMENT_CONFIG.deployToken) {
      const { config, salt } = loadTokenConfig();
      manifest.token = await deployToken(factory, deployer, config, salt);
    } else {
      console.log("Token deployment skipped. Set DEPLOYMENT_CONFIG.deployToken=true to continue.");
    }
  } finally {
    writeManifest(manifest);
  }
}

main().catch((error) => {
  console.error(error.stack || error.message || error);
  process.exitCode = 1;
});
