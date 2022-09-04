import { ethers } from "hardhat";
import { expect } from "chai";
import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers";

const TOTAL_SUPPLY_LIMIT = 100000;
const INITIAL_TOKEN_SUPPLY = 1000;
const AMOUNT = 100;

describe("TokenVesting", function () {
  async function deployTokenFixture() {
    const MoonappToken = await ethers.getContractFactory("MoonappToken");
    const TokenVesting = await ethers.getContractFactory("TokenVesting");
    const [owner, addr1, addr2] = await ethers.getSigners();

    const hardhatToken = await MoonappToken.deploy(
      'MoonappToken', 
      'XXX', 
      INITIAL_TOKEN_SUPPLY, 
      TOTAL_SUPPLY_LIMIT,
    );

    const start = await time.increase(3600);
    const cliff = 3600;
    const duration = await time.increase(3600 * 10);

    const hardhatVesting = await TokenVesting.deploy(addr1.address, start, cliff, duration);

    await hardhatToken.deployed();
    await hardhatVesting.deployed();

    await hardhatToken.mint(hardhatVesting.address, AMOUNT);
    
    return { MoonappToken, hardhatToken, hardhatVesting, owner, addr1, addr2 };
  }

  describe("Deployment", function() {
    it("Should set the right beneficiary", async function () {
      const { hardhatVesting, addr1 } = await loadFixture(deployTokenFixture);
      expect(await hardhatVesting.beneficiary()).to.equal(addr1.address);
    });

    it("Should mint the right amount", async function () {
      const { hardhatVesting, hardhatToken } = await loadFixture(deployTokenFixture);
      expect(await hardhatToken.balanceOf(hardhatVesting.address)).to.equal(AMOUNT);
    });
  });

  describe("Release", function() {
    it('cannot be released before cliff', async function () {
      const { hardhatVesting, hardhatToken } = await loadFixture(deployTokenFixture);
      await expect(
        hardhatVesting.release(hardhatToken.address)
      ).to.be.revertedWith('tokens cannot be released');
    });
  });
});