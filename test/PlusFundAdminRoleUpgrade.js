const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

const EXPECTED_PLUSFUND_ADMIN =
  "0x1af9f09295e73130ad6fd58704a26fe468d3f3e194879e90badd83ab85dd89f9";

describe("PlusFund admin role rename upgrade", function () {
  it("preserves existing role grants and removes the old getter", async function () {
    const [owner, admin] = await ethers.getSigners();
    const Legacy = await ethers.getContractFactory(
      "PlusFundLegacyRoleGetterMock",
    );
    const proxy = await upgrades.deployProxy(
      Legacy,
      ["PlusFund", "PLUS"],
      { initializer: "initialize" },
    );
    await proxy.waitForDeployment();

    const oldRoleId = await proxy.STOKEN_ADMIN();
    expect(oldRoleId).to.equal(EXPECTED_PLUSFUND_ADMIN);
    expect(oldRoleId).to.equal(ethers.id("STOKEN_ADMIN"));
    await proxy.grantRole(oldRoleId, admin.address);

    const PlusFund = await ethers.getContractFactory("PlusFund");
    await upgrades.validateUpgrade(await proxy.getAddress(), PlusFund, {
      kind: "uups",
    });
    const upgraded = await upgrades.upgradeProxy(
      await proxy.getAddress(),
      PlusFund,
      { kind: "uups" },
    );

    const newRoleId = await upgraded.PLUSFUND_ADMIN();
    expect(newRoleId).to.equal(oldRoleId);
    expect(await upgraded.hasRole(newRoleId, admin.address)).to.equal(true);
    await upgraded.connect(admin).pause();
    expect(await upgraded.paused()).to.equal(true);
    await upgraded.connect(admin).unpause();

    expect(upgraded.STOKEN_ADMIN).to.equal(undefined);
    let legacyGetterStillWorks = true;
    try {
      await ethers.provider.call({
        to: await upgraded.getAddress(),
        data: ethers.id("STOKEN_ADMIN()").slice(0, 10),
      });
    } catch {
      legacyGetterStillWorks = false;
    }
    expect(legacyGetterStillWorks).to.equal(false);
    expect(await upgraded.hasRole(await upgraded.DEFAULT_ADMIN_ROLE(), owner.address))
      .to.equal(true);
  });
});
