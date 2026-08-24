const { ethers } = require("ethers");

const ABI = [
  "event onChainRedemptionEvent(uint256 redemptionId, address uAddress, uint256 stokenAmount, address user, uint16 source)",
  "event claimUSDEvent(uint256 redemptionId, uint256 uAmount, address uAddress, uint256 stokenAmount, address user, uint256 price, uint256 time, bytes32 udaTxHash, uint16 source, uint256 technicalServiceFee)",
  "event overwriteOnChainRedemptionEvent(uint256 redemptionId, uint256 uAmount, uint256 price, uint256 time, bytes32 udaTxHash, uint256 technicalServiceFee, tuple(uint256 id, uint256 amount)[] tokenTransferDetails)",
];

const iface = new ethers.Interface(ABI);

function requiredEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

function toJson(value) {
  return JSON.stringify(value, (_, current) => {
    if (typeof current === "bigint") return current.toString();
    return current;
  }, 2);
}

async function getLogsInChunks(provider, filter, fromBlock, toBlock, chunkSize) {
  const logs = [];
  for (let start = fromBlock; start <= toBlock; start += chunkSize) {
    const end = Math.min(start + chunkSize - 1, toBlock);
    console.log(`Scanning blocks ${start} - ${end}...`);
    logs.push(...await provider.getLogs({ ...filter, fromBlock: start, toBlock: end }));
  }
  return logs;
}

function parseLogs(logs) {
  return logs.map((log) => {
    const parsed = iface.parseLog(log);
    if (!parsed) return null;
    return {
      name: parsed.name,
      args: parsed.args,
      blockNumber: log.blockNumber,
      transactionHash: log.transactionHash,
      logIndex: log.index,
    };
  }).filter(Boolean);
}

async function main() {
  const rpcUrl = requiredEnv("RPC_URL");
  const tokenAddress = ethers.getAddress(requiredEnv("TOKEN_ADDRESS"));
  const fromBlock = Number(requiredEnv("FROM_BLOCK"));
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const toBlock = process.env.TO_BLOCK
    ? Number(process.env.TO_BLOCK)
    : await provider.getBlockNumber();
  const chunkSize = Number(process.env.CHUNK_SIZE || 20_000);
  const outputPath = process.env.OUTPUT;

  if (!Number.isSafeInteger(fromBlock) || fromBlock < 0) {
    throw new Error("FROM_BLOCK must be a non-negative integer");
  }
  if (!Number.isSafeInteger(toBlock) || toBlock < fromBlock) {
    throw new Error("TO_BLOCK must be an integer greater than or equal to FROM_BLOCK");
  }
  if (!Number.isSafeInteger(chunkSize) || chunkSize <= 0) {
    throw new Error("CHUNK_SIZE must be a positive integer");
  }

  const eventNames = [
    "onChainRedemptionEvent",
    "overwriteOnChainRedemptionEvent",
    "claimUSDEvent",
  ];
  const topics = eventNames.map((name) => iface.getEvent(name).topicHash);
  const logs = await getLogsInChunks(
    provider,
    { address: tokenAddress, topics: [topics] },
    fromBlock,
    toBlock,
    chunkSize,
  );
  const events = parseLogs(logs);
  const redemptions = new Map();
  const unmatchedClaims = [];

  for (const event of events) {
    const id = event.args.redemptionId.toString();
    if (event.name === "onChainRedemptionEvent") {
      const existing = redemptions.get(id) || { redemptionId: id };
      existing.onChainRedemption = {
        uAddress: event.args.uAddress,
        stokenAmount: event.args.stokenAmount,
        user: event.args.user,
        source: event.args.source,
        blockNumber: event.blockNumber,
        transactionHash: event.transactionHash,
      };
      redemptions.set(id, existing);
    } else if (event.name === "overwriteOnChainRedemptionEvent") {
      const existing = redemptions.get(id) || { redemptionId: id };
      existing.overwrites = existing.overwrites || [];
      existing.overwrites.push({
        uAmount: event.args.uAmount,
        price: event.args.price,
        time: event.args.time,
        technicalServiceFee: event.args.technicalServiceFee,
        blockNumber: event.blockNumber,
        transactionHash: event.transactionHash,
      });
      redemptions.set(id, existing);
    } else if (event.name === "claimUSDEvent") {
      const existing = redemptions.get(id);
      const claim = {
        uAmount: event.args.uAmount,
        user: event.args.user,
        blockNumber: event.blockNumber,
        transactionHash: event.transactionHash,
      };
      if (existing) {
        existing.claim = claim;
      } else {
        unmatchedClaims.push({ redemptionId: id, claim });
      }
    }
  }

  const allRedemptions = [...redemptions.values()]
    .filter((item) => item.onChainRedemption)
    .sort((a, b) => Number(a.redemptionId) - Number(b.redemptionId));
  const pending = allRedemptions.filter((item) => !item.claim);
  const claimed = allRedemptions.filter((item) => item.claim);
  const report = {
    tokenAddress,
    fromBlock,
    toBlock,
    scannedEventCount: events.length,
    onChainRedemptionCount: allRedemptions.length,
    claimedCount: claimed.length,
    pendingCount: pending.length,
    pending,
    claimed,
    unmatchedClaims,
  };

  console.log(toJson(report));
  if (outputPath) {
    require("fs").writeFileSync(outputPath, `${toJson(report)}\n`, "utf8");
    console.log(`Report written to ${outputPath}`);
  }
  if (pending.length > 0) process.exitCode = 2;
}

main().catch((error) => {
  console.error(error.shortMessage || error.message || error);
  process.exitCode = 1;
});
