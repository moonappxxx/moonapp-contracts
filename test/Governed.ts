import { ethers } from "hardhat";
import { expect } from "chai";
import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers";

const TOTAL_SUPPLY_LIMIT = 100000;
const INITIAL_TOKEN_SUPPLY = 1000;
const ONE_MONTH = 60 * 60 * 24 * 30;

describe("TokenVesting", function () {
  async function deployTokenFixture() {
    const MoonappToken = await ethers.getContractFactory("MoonappToken");
    const [owner, addr1, addr2] = await ethers.getSigners();

    // const hardhatGoverned = await Governed.deploy();
    const hardhatToken = await MoonappToken.deploy(
      'MoonappToken', 
      'XXX', 
      INITIAL_TOKEN_SUPPLY, 
      TOTAL_SUPPLY_LIMIT,
    );

    // await hardhatGoverned.deployed();
    await hardhatToken.deployed();

    return { hardhatToken, owner, addr1, addr2 };
  }

  describe("Governance", function() {
    it('should properly initialize governor', async function () {
      const { hardhatToken, owner } = await loadFixture(deployTokenFixture);
      const governor = await hardhatToken.governors(owner.address);

      expect(governor.invitedBy).to.equal(owner.address);
      expect(governor.governorAddress).to.equal(owner.address);
      expect(governor.ownershipAccepted).to.equal(true);
    });

    it('should add governor', async function () {
      const { hardhatToken, addr1, owner } = await loadFixture(deployTokenFixture);
      await hardhatToken.addOwnership(addr1.address);
      const pendingGovernor = await hardhatToken.pendingGovernors(addr1.address);

      expect(pendingGovernor?.invitedBy).to.equal(owner.address);
    });

    it('should accept the ownership', async function () {
      const { hardhatToken, addr1, addr2, owner } = await loadFixture(deployTokenFixture);
      await hardhatToken.addOwnership(addr1.address);
      
      await expect(
        hardhatToken.connect(addr2).acceptOwnership()
      ).to.be.revertedWith("Caller must be pending governor");

      await hardhatToken.connect(addr1).acceptOwnership()

      const governor = await hardhatToken.governors(addr1.address);
      expect(governor.invitedBy).to.equal(owner.address);
      expect(governor.governorAddress).to.equal(addr1.address);
      expect(governor.ownershipAccepted).to.equal(true);
    });

    it('should delete expired ownership request', async function () {
      const { hardhatToken, addr1 } = await loadFixture(deployTokenFixture);
      await hardhatToken.addOwnership(addr1.address);

      const now = await time.latest() + ONE_MONTH;
      await time.increaseTo(now);

      await hardhatToken.connect(addr1).acceptOwnership()

      const governor = await hardhatToken.governors(addr1.address);
      const pendingGovernor = await hardhatToken.pendingGovernors(addr1.address);

      expect(pendingGovernor.invitedBy).to.equal('0x0000000000000000000000000000000000000000');
      expect(pendingGovernor.expirationDate).to.equal(0);

      expect(governor.invitedBy).to.equal('0x0000000000000000000000000000000000000000');
      expect(governor.governorAddress).to.equal('0x0000000000000000000000000000000000000000');
      expect(governor.ownershipAccepted).to.equal(false);
    });
  });
});