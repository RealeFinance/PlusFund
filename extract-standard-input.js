const fs = require("fs");
const path = require("path");

const ROOT_DIR = process.cwd();
const DEFAULT_TARGET = "contracts/token/PlusFund.sol:PlusFund";

function normalizeBytecode(bytecode) {
  return (bytecode || "").replace(/^0x/i, "").toLowerCase();
}

function parseTarget(target) {
  const separator = target.lastIndexOf(":");
  const sourceName = (separator === -1 ? target : target.slice(0, separator))
    .replace(/\\/g, "/");
  const contractName = separator === -1
    ? path.basename(sourceName, ".sol")
    : target.slice(separator + 1);

  if (!sourceName.endsWith(".sol") || !contractName) {
    throw new Error(
      `Invalid target "${target}". Use source.sol:ContractName, for example ${DEFAULT_TARGET}`,
    );
  }

  return { sourceName, contractName };
}

function generateStandardInput() {
  const target = process.argv[2] || DEFAULT_TARGET;
  const outputFile = path.resolve(ROOT_DIR, process.argv[3] || "standard-input.json");
  const { sourceName, contractName } = parseTarget(target);
  const artifactPath = path.resolve(
    ROOT_DIR,
    "artifacts",
    sourceName,
    `${contractName}.json`,
  );
  const buildInfoDir = path.resolve(ROOT_DIR, "artifacts", "build-info");

  if (!fs.existsSync(artifactPath)) {
    throw new Error(
      `Artifact not found: ${path.relative(ROOT_DIR, artifactPath)}. Compile the project first.`,
    );
  }
  if (!fs.existsSync(buildInfoDir)) {
    throw new Error(`Build-info directory not found: ${buildInfoDir}. Compile the project first.`);
  }

  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
  const artifactBytecode = normalizeBytecode(artifact.deployedBytecode);
  const candidates = fs.readdirSync(buildInfoDir)
    .filter((name) => name.endsWith(".json"))
    .map((name) => {
      const filePath = path.join(buildInfoDir, name);
      try {
        const buildInfo = JSON.parse(fs.readFileSync(filePath, "utf8"));
        const compiledContract = buildInfo.output?.contracts?.[sourceName]?.[contractName];
        const buildBytecode = normalizeBytecode(
          compiledContract?.evm?.deployedBytecode?.object,
        );
        return compiledContract && buildBytecode === artifactBytecode
          ? { filePath, buildInfo, compiledContract }
          : null;
      } catch {
        return null;
      }
    })
    .filter(Boolean)
    .sort((a, b) => fs.statSync(b.filePath).mtimeMs - fs.statSync(a.filePath).mtimeMs);

  if (candidates.length === 0) {
    throw new Error(
      `No build-info matches the deployed bytecode in ${path.relative(ROOT_DIR, artifactPath)}. ` +
        "Recompile the target and ensure you use the build that produced the deployment.",
    );
  }

  const { filePath, buildInfo } = candidates[0];
  const input = buildInfo.input;
  if (!input || input.language !== "Solidity" || !input.settings || !input.sources) {
    throw new Error(`Invalid Solidity build-info input: ${filePath}`);
  }

  fs.mkdirSync(path.dirname(outputFile), { recursive: true });
  fs.writeFileSync(outputFile, `${JSON.stringify(input, null, 2)}\n`, "utf8");

  console.log(`Target: ${sourceName}:${contractName}`);
  console.log(`Build-info: ${path.relative(ROOT_DIR, filePath)}`);
  console.log(`Compiler: ${buildInfo.solcLongVersion || buildInfo.solcVersion}`);
  console.log(`Optimizer: ${JSON.stringify(input.settings.optimizer || {})}`);
  console.log(`viaIR: ${input.settings.viaIR ?? false}`);
  console.log(`EVM version: ${input.settings.evmVersion || "compiler default"}`);
  console.log(`Sources: ${Object.keys(input.sources).length}`);
  console.log(`Output: ${path.relative(ROOT_DIR, outputFile)}`);
}

try {
  generateStandardInput();
} catch (error) {
  console.error(`Standard JSON generation failed: ${error.message}`);
  process.exitCode = 1;
}
