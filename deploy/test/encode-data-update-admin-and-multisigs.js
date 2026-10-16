const { ethers } = require("hardhat");

async function main() {
  // ===== 按目标网络填写 =====
  const proxyAddress = "0x238Bd29Bc460F6cB56f80f99B2B39Ff2c183Ee4D";
  const timelockAddress = "0xbfc85c81133D74519cc09Bf558D51D9628850E67";

  // PLUSFUND_ADMIN 角色从旧地址迁移到新地址
  const oldPlusFundAdminAddress = "0xe2bAf9f6AB217aCC06037Ee41C6B71994F5a388a";
  const newPlusFundAdminAddress = "0x04421e058E9369aAA45D4b9138f3A44D7aAe486b";

  // 资产相关的三个多签地址
  const assetRecipient = "0xF9bAA82FaA4bC7ffC853218BAd434f79fAFc8B60";
  const assetSender = "0xF9bAA82FaA4bC7ffC853218BAd434f79fAFc8B60";
  const serviceFeeRecipient = "0xF9bAA82FaA4bC7ffC853218BAd434f79fAFc8B60";

  // 同一批次后续再次使用时，请更换 salt，防止 operationId 冲突。
  const predecessor = ethers.ZeroHash;
  const salt = ethers.id("PlusFund admin and multisig update");
  const minDelay = 172800; // 48 小时

  function requireAddress(value, name) {
    if (!ethers.isAddress(value)) {
      throw new Error(`${name} 不是有效地址，请先填写脚本顶部的配置项。`);
    }
    const normalized = ethers.getAddress(value);
    if (normalized === ethers.ZeroAddress) {
      throw new Error(`${name} 不能是零地址。`);
    }
    return normalized;
  }

  const proxy = requireAddress(proxyAddress, "proxyAddress");
  const timelockAddressChecked = requireAddress(
    timelockAddress,
    "timelockAddress",
  );
  const oldAdmin = requireAddress(
    oldPlusFundAdminAddress,
    "oldPlusFundAdminAddress",
  );
  const newAdmin = requireAddress(
    newPlusFundAdminAddress,
    "newPlusFundAdminAddress",
  );
  const newAssetRecipient = requireAddress(assetRecipient, "assetRecipient");
  const newAssetSender = requireAddress(assetSender, "assetSender");
  const newServiceFeeRecipient = requireAddress(
    serviceFeeRecipient,
    "serviceFeeRecipient",
  );

  if (oldAdmin === newAdmin) {
    throw new Error("新旧 PLUSFUND_ADMIN 地址相同，无需迁移。");
  }

  const fund = await ethers.getContractAt("PlusFund", proxy);
  const timelock = await ethers.getContractAt(
    "TimelockController",
    timelockAddressChecked,
  );
  const plusFundAdminRole = "0x1af9f09295e73130ad6fd58704a26fe468d3f3e194879e90badd83ab85dd89f9";

  // 先授予新地址角色，再撤销旧地址角色，最后更新三个多签地址。
  // 这五个内部调用只组成一个 Timelock batch operation，由 PlusFund 代理执行。
  const calls = [
    {
      label: "grantRole(PLUSFUND_ADMIN, new address)",
      data: fund.interface.encodeFunctionData("grantRole", [
        plusFundAdminRole,
        newAdmin,
      ]),
    },
    {
      label: "revokeRole(PLUSFUND_ADMIN, old address)",
      data: fund.interface.encodeFunctionData("revokeRole", [
        plusFundAdminRole,
        oldAdmin,
      ]),
    },
    {
      label: "setAssetRecipient",
      data: fund.interface.encodeFunctionData("setAssetRecipient", [
        newAssetRecipient,
      ]),
    },
    {
      label: "setAssetSender",
      data: fund.interface.encodeFunctionData("setAssetSender", [
        newAssetSender,
      ]),
    },
    {
      label: "setServiceFeeRecipient",
      data: fund.interface.encodeFunctionData("setServiceFeeRecipient", [
        newServiceFeeRecipient,
      ]),
    },
  ];

  const targets = calls.map(() => proxy);
  const values = calls.map(() => 0);
  const datas = calls.map(({ data }) => data);

  const operationId = await timelock.hashOperationBatch(
    targets,
    values,
    datas,
    predecessor,
    salt,
  );
  const scheduleData = timelock.interface.encodeFunctionData("scheduleBatch", [
    targets,
    values,
    datas,
    predecessor,
    salt,
    minDelay,
  ]);
  const executeData = timelock.interface.encodeFunctionData("executeBatch", [
    targets,
    values,
    datas,
    predecessor,
    salt,
  ]);
  const cancelData = timelock.interface.encodeFunctionData("cancel", [
    operationId,
  ]);

  console.log(`网络: ${hre.network.name}`);
  console.log(`PlusFund proxy: ${proxy}`);
  console.log(`Timelock: ${timelockAddressChecked}`);
  console.log(`PLUSFUND_ADMIN role: ${plusFundAdminRole}`);
  console.log(`Timelock 批次操作数: ${calls.length}`);
  console.log("批次内部调用顺序（不会分别提交）:");
  calls.forEach(({ label }, index) => console.log(`  ${index + 1}. ${label}`));
  console.log(`\nOperation ID: ${operationId}`);
  console.log("\n第 1 笔 Timelock 交易：排期整个批次（提交一次）");
  console.log("To:    ", timelockAddressChecked);
  console.log("Value: ", 0);
  console.log("Data:  ", scheduleData);
  console.log("\n等待 Timelock 延迟结束后，第 2 笔 Timelock 交易：执行整个批次（提交一次）");
  console.log("To:    ", timelockAddressChecked);
  console.log("Value: ", 0);
  console.log("Data:  ", executeData);
  console.log("\n如需取消整个批次，调用以下交易：");
  console.log("To:    ", timelockAddressChecked);
  console.log("Value: ", 0);
  console.log("Data:  ", cancelData);
}

const hre = require("hardhat");
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

// npx hardhat run .\deploy\test\encode-data-update-admin-and-multisigs.js --network <network>
