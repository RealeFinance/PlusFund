const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

describe("PlusFund cross-chain mint validation", function () {
  async function deployFixture() {
    const [owner, user, poolAdmin] = await ethers.getSigners();
    const PlusFund = await ethers.getContractFactory("PlusFund");
    const token = await upgrades.deployProxy(
      PlusFund,
      ["PlusFund", "PLUS"],
      { initializer: "initialize" },
    );
    await token.waitForDeployment();

    await token.grantRole(await token.POOL_ADMIN_ROLE(), poolAdmin.address);
    return { token, owner, user, poolAdmin };
  }

  it("rejects token ID zero without changing wallet or supply state", async function () {
    const { token, user, poolAdmin } = await deployFixture();
    const amount = ethers.parseEther("1");

    await expect(
      token.connect(poolAdmin).mint(
        user.address,
        amount,
        [[0n, user.address, 31337n]],
        [amount],
      ),
    ).to.be.revertedWith("Invalid token ID");

    expect(await token.balanceOf(user.address)).to.equal(0n);
    expect(await token.totalSupply()).to.equal(0n);
    const wallet = await token.wallets(user.address);
    expect(wallet.headIndex).to.equal(0n);
    expect(wallet.tailIndex).to.equal(0n);
    expect(wallet.totalBalance).to.equal(0n);

    const [tokenIds, amounts] = await token.balanceOfWithId(user.address);
    expect(tokenIds).to.deep.equal([]);
    expect(amounts).to.deep.equal([]);
  });

  it("continues to accept a nonzero token ID such as one", async function () {
    const { token, user, poolAdmin } = await deployFixture();
    const amount = ethers.parseEther("1");

    await token.connect(poolAdmin).mint(
      user.address,
      amount,
      [[1n, user.address, 31337n]],
      [amount],
    );

    expect(await token.balanceOf(user.address)).to.equal(amount);
    const [tokenIds, amounts] = await token.balanceOfWithId(user.address);
    expect(tokenIds).to.deep.equal([1n]);
    expect(amounts).to.deep.equal([amount]);
  });
});
