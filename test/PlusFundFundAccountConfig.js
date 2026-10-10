const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

describe("PlusFund fund account configuration", function () {
  async function deployFixture() {
    const [owner, user] = await ethers.getSigners();
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
    return { token, paymentToken, owner, user };
  }

  it("initializes fund accounts unset and blocks online operations until configured", async function () {
    const { token, paymentToken, user, owner } = await deployFixture();
    const proxy = await token.getAddress();

    expect(await token.assetRecipient()).to.equal(ethers.ZeroAddress);
    expect(await token.assetSender()).to.equal(ethers.ZeroAddress);
    expect(await token.serviceFeeRecipient()).to.equal(ethers.ZeroAddress);

    await expect(
      token.connect(user).onChainSubscribe(
        await paymentToken.getAddress(),
        ethers.parseEther("100"),
        1,
      ),
    ).to.be.revertedWithCustomError(token, "FundAccountsNotConfigured");

    const stokenAmount = ethers.parseEther("1");
    await token.grantRole(await token.POOL_ADMIN_ROLE(), owner.address);
    await token.mint(
      user.address,
      stokenAmount,
      [[1n, user.address, 31337n]],
      [stokenAmount],
    );

    await expect(
      token.connect(user).onChainRedemption(
        await paymentToken.getAddress(),
        stokenAmount,
        1,
      ),
    ).to.be.revertedWithCustomError(token, "FundAccountsNotConfigured");
    expect(await token.balanceOf(user.address)).to.equal(stokenAmount);

    await expect(
      token.connect(user).claimUSD(1),
    ).to.be.revertedWithCustomError(token, "FundAccountsNotConfigured");

    await expect(token.setAssetRecipient(proxy)).to.be.revertedWithCustomError(
      token,
      "InvalidFundAccount",
    );
    await expect(token.setAssetSender(proxy)).to.be.revertedWithCustomError(
      token,
      "InvalidFundAccount",
    );
    await expect(
      token.setServiceFeeRecipient(proxy),
    ).to.be.revertedWithCustomError(token, "InvalidFundAccount");
  });

  it("allows externally configured treasury accounts", async function () {
    const { token, owner } = await deployFixture();

    await token.setAssetRecipient(owner.address);
    await token.setAssetSender(owner.address);
    await token.setServiceFeeRecipient(owner.address);

    expect(await token.assetRecipient()).to.equal(owner.address);
    expect(await token.assetSender()).to.equal(owner.address);
    expect(await token.serviceFeeRecipient()).to.equal(owner.address);
  });
});
