const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

const EXPECTED_PLUSFUND_ADMIN =
  "0x1af9f09295e73130ad6fd58704a26fe468d3f3e194879e90badd83ab85dd89f9";

describe("PlusFund admin role", function () {
  it("keeps the legacy role ID under the current getter", async function () {
    const [owner, admin] = await ethers.getSigners();
    const PlusFund = await ethers.getContractFactory("PlusFund");
    const proxy = await upgrades.deployProxy(PlusFund, ["PlusFund", "PLUS"], {
      initializer: "initialize",
    });
    await proxy.waitForDeployment();

    const plusFundAdminRole = await proxy.PLUSFUND_ADMIN();
    expect(plusFundAdminRole).to.equal(EXPECTED_PLUSFUND_ADMIN);
    await proxy.grantRole(plusFundAdminRole, admin.address);
    expect(await proxy.hasRole(plusFundAdminRole, admin.address)).to.equal(true);
    await proxy.connect(admin).pause();
    expect(await proxy.paused()).to.equal(true);
    await proxy.connect(admin).unpause();
    expect(await proxy.hasRole(await proxy.DEFAULT_ADMIN_ROLE(), owner.address))
      .to.equal(true);
  });
});
