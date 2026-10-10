const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

describe("PlusFund on-chain redemption", function () {
  async function deployFixture() {
    const [owner, user, admin] = await ethers.getSigners();
    const PlusFund = await ethers.getContractFactory("PlusFund");
    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    const paymentToken = await MockUSDC.deploy();
    await paymentToken.waitForDeployment();
    const token = await upgrades.deployProxy(
      PlusFund,
      ["PlusFund", "PLUS"],
      { initializer: "initialize" },
    );
    await token.waitForDeployment();

    await token.setAssetRecipient(owner.address);
    await token.setAssetSender(owner.address);
    await token.setServiceFeeRecipient(owner.address);

    const stokenAdmin = await token.PLUSFUND_ADMIN();
    const poolAdmin = await token.POOL_ADMIN_ROLE();
    await token.grantRole(stokenAdmin, admin.address);
    await token.grantRole(poolAdmin, admin.address);
    await token
      .connect(admin)
      .addSupportedTokenAddress(await paymentToken.getAddress());

    return { token, owner, user, admin, paymentToken };
  }

  it("rejects burning an on-chain redemption after it has already burned", async function () {
    const { token, user, admin, paymentToken } = await deployFixture();
    const amount = ethers.parseEther("10");

    await token.connect(admin).mint(
      user.address,
      ethers.parseEther("100"),
      [[1n, user.address, 31337n]],
      [ethers.parseEther("100")],
    );

    const redemptionTx = await token
      .connect(user)
      .onChainRedemption(await paymentToken.getAddress(), amount, 1);
    const redemptionReceipt = await redemptionTx.wait();
    const redemptionEvent = redemptionReceipt.logs
      .map((log) => {
        try {
          return token.interface.parseLog(log);
        } catch {
          return null;
        }
      })
      .find((parsed) => parsed?.name === "onChainRedemptionEvent");
    const redemptionId = redemptionEvent.args.redemptionId;

    await token.connect(admin).overwriteOnChainRedemption(
      redemptionId,
      ethers.parseUnits("10", 6),
      ethers.parseEther("1"),
      1n,
      ethers.ZeroHash,
    );

    await expect(token.connect(admin).burn(redemptionId)).to.be.revertedWith(
      "Cannot burn on-chain redemption",
    );
    expect(await token.balanceOf(user.address)).to.equal(ethers.parseEther("90"));
  });

  it("allows source zero when the redemption is explicitly marked on-chain", async function () {
    const { token, owner, user, admin, paymentToken } = await deployFixture();
    const amount = ethers.parseEther("10");
    const uAmount = ethers.parseUnits("10", 6);

    await token.connect(admin).mint(
      user.address,
      ethers.parseEther("100"),
      [[1n, user.address, 31337n]],
      [ethers.parseEther("100")],
    );

    const redemptionTx = await token
      .connect(user)
      .onChainRedemption(await paymentToken.getAddress(), amount, 0);
    const redemptionReceipt = await redemptionTx.wait();
    const redemptionEvent = redemptionReceipt.logs
      .map((log) => {
        try {
          return token.interface.parseLog(log);
        } catch {
          return null;
        }
      })
      .find((parsed) => parsed?.name === "onChainRedemptionEvent");
    const redemptionId = redemptionEvent.args.redemptionId;

    await token.connect(admin).overwriteOnChainRedemption(
      redemptionId,
      uAmount,
      ethers.parseEther("1"),
      1n,
      ethers.ZeroHash,
    );
    await token.connect(owner).setAssetSender(owner.address);
    await token.connect(owner).setServiceFeeRecipient(admin.address);
    await paymentToken.mint(owner.address, uAmount);
    await paymentToken
      .connect(owner)
      .approve(await token.getAddress(), uAmount);

    const claimTx = await token.connect(user).claimUSD(redemptionId);
    await expect(claimTx).to.emit(token, "claimUSDEvent");
    const claimReceipt = await claimTx.wait();
    const paymentTransfers = claimReceipt.logs
      .map((log) => {
        try {
          return paymentToken.interface.parseLog(log);
        } catch {
          return null;
        }
      })
      .filter((parsed) => parsed?.name === "Transfer");

    expect(paymentTransfers).to.have.length(1);
    expect(paymentTransfers[0].args.to).to.equal(user.address);
    expect(paymentTransfers[0].args.value).to.equal(uAmount);
    expect(await paymentToken.balanceOf(user.address)).to.equal(uAmount);
    expect(await paymentToken.balanceOf(admin.address)).to.equal(0n);
  });

});
