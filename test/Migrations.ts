import { ethers } from "hardhat";
import { expect } from "chai";
import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers";

describe("TokenVesting", function () {
  async function deployTokenFixture() {
    const [owner, addr1, addr2] = await ethers.getSigners();

    const Migrations = await ethers.getContractFactory("Migrations");
    const hardhatMigrations = await Migrations.deploy();
    
    return { hardhatMigrations, owner, addr1, addr2 };
  }

  describe("Deployment", function() {
    it("Should set the right owner", async function () {
      const { hardhatMigrations, owner } = await loadFixture(deployTokenFixture);

      expect(await hardhatMigrations.owner()).to.equal(owner.address);
    });

    it("Should set the last completed migration", async function () {
      const { hardhatMigrations, addr1 } = await loadFixture(deployTokenFixture);

      const latestTime = await time.latest();
      
      expect(await hardhatMigrations.last_completed_migration()).to.equal(0);
      
      await hardhatMigrations.setCompleted(latestTime);
      
      expect(await hardhatMigrations.last_completed_migration()).to.equal(latestTime);
    });

    it("Should throw if not an owner", async function () {
      const { hardhatMigrations, addr1 } = await loadFixture(deployTokenFixture);

      const latestTime = await time.latest();
      
      expect(
        hardhatMigrations.connect(addr1.address).setCompleted(latestTime)
      ).to.be.revertedWith("This function is restricted to the contract's owner");
    });
  });
});