const { ethers } = require("hardhat");

async function main() {
  // ===== 需要填写/确认的参数 =====
  // 每次只为一个 PlusFund 代理生成调用数据；修改下面三项后运行脚本。
  // minSubscriptionAmount 按整美元填写；minRedemptionAmount 按 Cash+ 数量填写，支持小数。
  const proxyAddress = "0x238Bd29Bc460F6cB56f80f99B2B39Ff2c183Ee4D";
  const minSubscriptionAmount = 100000n;
  const minRedemptionAmount = "83.842";

  const addressPattern = /^0x[0-9a-fA-F]{40}$/;
  if (!addressPattern.test(proxyAddress)) {
    throw new Error("请先填写有效的 proxyAddress");
  }
  if (minSubscriptionAmount < 0n) {
    throw new Error("minSubscriptionAmount 不能小于 0");
  }

  const plusFundInterface = new ethers.Interface([
    "function setMinSubscriptionAmount(uint256 amount)",
    "function setMinRedemptionAmount(uint256 amount)",
  ]);

  const calls = [
    {
      method: "setMinSubscriptionAmount",
      parameter: minSubscriptionAmount.toString(),
      data: plusFundInterface.encodeFunctionData(
        "setMinSubscriptionAmount",
        [minSubscriptionAmount],
      ),
    },
    {
      method: "setMinRedemptionAmount",
      parameter: ethers.parseEther(minRedemptionAmount).toString(),
      data: plusFundInterface.encodeFunctionData("setMinRedemptionAmount", [
        ethers.parseEther(minRedemptionAmount),
      ]),
    },
  ];

  console.log("Safe Batch：新增两条交易后，在 Safe 中作为一个 batch 提交。");
  console.log("以下每个 Data 都是一条独立调用的 Hex calldata，可分别粘贴到表单的 Data 字段。");
  console.log("两条交易的 To Address 都填写 PlusFund 代理地址，BNB value 填 0。\n");

  for (let index = 0; index < calls.length; index++) {
    const call = calls[index];
    console.log(`=== Transaction ${index + 1}: ${call.method} ===`);
    console.log(`To Address: ${proxyAddress}`);
    console.log("BNB value: 0");
    console.log(`Data (Hex encoded): ${call.data}\n`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

// 示例: npx hardhat run .\deploy\test\encode-data-update-min-amounts.js --network bsc
