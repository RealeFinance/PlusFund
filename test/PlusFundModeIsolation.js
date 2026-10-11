const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

function findEvent(receipt, iface, name) {
  return receipt.logs
    .map((log) => {
      try {
        return iface.parseLog(log);
      } catch {
        return null;
      }
    })
    .find((parsed) => parsed?.name === name);
}

describe("PlusFund online/offline mode isolation", function () {
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

    const subscriptionAmount = ethers.parseEther("100");
    await paymentToken.mint(user.address, subscriptionAmount * 2n);
    await paymentToken
      .connect(user)
      .approve(await token.getAddress(), subscriptionAmount * 2n);

    return { owner, user, admin, token, paymentToken, subscriptionAmount };
  }

  it("keeps online and offline subscription workflows separate", async function () {
    const { user, admin, token, paymentToken, subscriptionAmount } =
      await deployFixture();
    const stokenAmount = ethers.parseEther("1");

    const offlineTx = await token.connect(admin).subscribe(
      subscriptionAmount,
      await paymentToken.getAddress(),
      stokenAmount,
      user.address,
      ethers.parseEther("1"),
      1n,
      ethers.ZeroHash,
      "offline-subscription",
    );
    const offlineReceipt = await offlineTx.wait();
    const offlineEvent = findEvent(
      offlineReceipt,
      token.interface,
      "subscribeEvent",
    );
    const offlineId = offlineEvent.args.subscriptionId;

    await expect(
      token.connect(admin).overwriteOnChainSubscribe(
        offlineId,
        ethers.parseEther("1"),
        stokenAmount,
        1n,
        ethers.ZeroHash,
        "offline-subscription",
      ),
    ).to.be.revertedWith("Only on-chain subscription");

    await expect(token.connect(user).claim(offlineId)).to.be.revertedWith(
      "Only on-chain subscription",
    );
    await expect(token.connect(admin).execute(offlineId)).not.to.be.reverted;

    const onlineTx = await token
      .connect(user)
      .onChainSubscribe(
        await paymentToken.getAddress(),
        subscriptionAmount,
        0,
      );
    const onlineReceipt = await onlineTx.wait();
    const onlineEvent = findEvent(
      onlineReceipt,
      token.interface,
      "onChainSubscribeEvent",
    );
    const onlineId = onlineEvent.args.subscriptionId;

    await token.connect(admin).overwriteOnChainSubscribe(
      onlineId,
      ethers.parseEther("1"),
      stokenAmount,
      1n,
      ethers.ZeroHash,
      "online-subscription",
    );

    await expect(token.connect(admin).execute(onlineId)).to.be.revertedWith(
      "Only off-chain subscription",
    );
    await expect(token.connect(user).claim(onlineId)).not.to.be.reverted;
  });

  it("rejects zero-share offline subscriptions and on-chain subscription overwrites", async function () {
    const { user, admin, token, paymentToken, subscriptionAmount } =
      await deployFixture();

    await expect(
      token.connect(admin).subscribe(
        subscriptionAmount,
        await paymentToken.getAddress(),
        0,
        user.address,
        ethers.parseEther("1"),
        1n,
        ethers.ZeroHash,
        "zero-share-offline",
      ),
    ).to.be.revertedWithCustomError(token, "InvalidAssetAmount");

    const onlineTx = await token
      .connect(user)
      .onChainSubscribe(
        await paymentToken.getAddress(),
        subscriptionAmount,
        0,
      );
    const onlineReceipt = await onlineTx.wait();
    const onlineEvent = findEvent(
      onlineReceipt,
      token.interface,
      "onChainSubscribeEvent",
    );

    await expect(
      token.connect(admin).overwriteOnChainSubscribe(
        onlineEvent.args.subscriptionId,
        ethers.parseEther("1"),
        0,
        1n,
        ethers.ZeroHash,
        "zero-share-online",
      ),
    ).to.be.revertedWithCustomError(token, "InvalidAssetAmount");
  });

  it("prevents duplicate active subscription offChainIds and releases them after execution", async function () {
    const { user, admin, token, paymentToken, subscriptionAmount } =
      await deployFixture();
    const paymentTokenAddress = await paymentToken.getAddress();
    const createOfflineSubscription = (amount, offChainId) =>
      token.connect(admin).subscribe(
        amount,
        paymentTokenAddress,
        ethers.parseEther("1"),
        user.address,
        ethers.parseEther("1"),
        1n,
        ethers.ZeroHash,
        offChainId,
      );

    const firstTx = await createOfflineSubscription(
      subscriptionAmount,
      "duplicate-subscription-id",
    );
    const firstReceipt = await firstTx.wait();
    const firstEvent = findEvent(firstReceipt, token.interface, "subscribeEvent");

    await expect(
      createOfflineSubscription(subscriptionAmount + 1n, "duplicate-subscription-id"),
    ).to.be.revertedWithCustomError(token, "DuplicateOfflineOrderId");

    await token.connect(admin).execute(firstEvent.args.subscriptionId);
    await expect(
      createOfflineSubscription(subscriptionAmount + 1n, "duplicate-subscription-id"),
    ).not.to.be.reverted;
  });

  it("does not allow an offline redemption to use the online overwrite path", async function () {
    const { user, admin, token, paymentToken } = await deployFixture();
    const stokenAmount = ethers.parseEther("1");

    await token.connect(admin).mint(
      user.address,
      stokenAmount,
      [[1n, user.address, 31337n]],
      [stokenAmount],
    );

    const redemptionTx = await token.connect(admin).redemption(
      ethers.parseUnits("100", 6),
      await paymentToken.getAddress(),
      stokenAmount,
      user.address,
      ethers.parseEther("1"),
      1n,
      ethers.ZeroHash,
      "offline-redemption",
    );
    const redemptionReceipt = await redemptionTx.wait();
    const redemptionEvent = findEvent(
      redemptionReceipt,
      token.interface,
      "RedemptionEvent",
    );
    const redemptionId = redemptionEvent.args.redemptionId;

    await expect(
      token.connect(admin).overwriteOnChainRedemption(
        redemptionId,
        ethers.parseUnits("100", 6),
        ethers.parseEther("1"),
        1n,
        ethers.ZeroHash,
      ),
    ).to.be.revertedWith("Only on-chain redemption");

    await expect(token.connect(admin).burn(redemptionId)).not.to.be.reverted;
  });

  it("prevents duplicate active redemption offChainIds and releases them after burn", async function () {
    const { user, admin, token, paymentToken } = await deployFixture();
    const paymentTokenAddress = await paymentToken.getAddress();
    const stokenAmount = ethers.parseEther("1");
    await token.connect(admin).mint(
      user.address,
      stokenAmount * 2n,
      [
        [1n, user.address, 31337n],
        [2n, user.address, 31337n],
      ],
      [stokenAmount, stokenAmount],
    );

    const createOfflineRedemption = (amount, offChainId) =>
      token.connect(admin).redemption(
        amount,
        paymentTokenAddress,
        stokenAmount,
        user.address,
        ethers.parseEther("1"),
        1n,
        ethers.ZeroHash,
        offChainId,
      );
    const firstTx = await createOfflineRedemption(
      ethers.parseUnits("100", 6),
      "duplicate-redemption-id",
    );
    const firstReceipt = await firstTx.wait();
    const firstEvent = findEvent(
      firstReceipt,
      token.interface,
      "RedemptionEvent",
    );

    await expect(
      createOfflineRedemption(
        ethers.parseUnits("101", 6),
        "duplicate-redemption-id",
      ),
    ).to.be.revertedWithCustomError(token, "DuplicateOfflineOrderId");

    await token.connect(admin).burn(firstEvent.args.redemptionId);
    await expect(
      createOfflineRedemption(
        ethers.parseUnits("101", 6),
        "duplicate-redemption-id",
      ),
    ).not.to.be.reverted;
  });
});
