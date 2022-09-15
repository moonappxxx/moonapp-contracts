import { ethers } from "hardhat";
import { expect } from "chai";
import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers";

const TOTAL_SUPPLY_LIMIT = 100000;
const INITIAL_TOKEN_SUPPLY = 1000;
const VESTING_AMOUNT = 150;
const INITIAL_RELEASE_PERCENTAGE = 10;
const INITIAL_RELEASE_AMOUNT = VESTING_AMOUNT / 100 * INITIAL_RELEASE_PERCENTAGE;
const RELEASE_RATE = 15;
const ONE_MONTH = 60 * 60 * 24 * 30;

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

    const start = await time.latest();
    const cliff = ONE_MONTH * 2; // 1 month
    const vestingPeriod = ONE_MONTH;
    const beneficiary = addr1.address;
    const initialVestingBalance = VESTING_AMOUNT;

    const hardhatVesting = await TokenVesting.deploy(
      addr1.address, 
      start, 
      cliff, 
      RELEASE_RATE,
      INITIAL_RELEASE_AMOUNT
    );

    await hardhatToken.deployed();
    await hardhatVesting.deployed();

    await hardhatToken.mint(hardhatVesting.address, initialVestingBalance);
    
    return { MoonappToken, hardhatToken, hardhatVesting, owner, cliff, vestingPeriod, start, addr1, addr2, beneficiary, initialVestingBalance };
  }

  describe("Deployment", function() {
    it("Should set the right beneficiary", async function () {
      const { hardhatVesting, addr1 } = await loadFixture(deployTokenFixture);
      expect(await hardhatVesting.beneficiary()).to.equal(addr1.address);
    });

    it("Should mint the right amount", async function () {
      const { hardhatVesting, hardhatToken, initialVestingBalance } = await loadFixture(deployTokenFixture);
      expect(await hardhatToken.balanceOf(hardhatVesting.address)).to.equal(initialVestingBalance);
    });

    it("Should set the right initially released amount", async function () {
      const { hardhatVesting } = await loadFixture(deployTokenFixture);
      expect(await hardhatVesting.releasedInitially()).to.equal(INITIAL_RELEASE_AMOUNT);
    });

    it("Should return the proper releasable amount", async function () {
      const { hardhatVesting, hardhatToken } = await loadFixture(deployTokenFixture);
      expect(await hardhatVesting.releasableAmount(hardhatToken.address)).to.equal(INITIAL_RELEASE_AMOUNT);
    });

    it("Should return the proper locked amount", async function () {
      const { hardhatVesting, hardhatToken, initialVestingBalance } = await loadFixture(deployTokenFixture);
      expect(await hardhatVesting.lockedAmount(hardhatToken.address)).to.equal(initialVestingBalance);
    });

  });

  describe("Release", function() {
    it('cannot be released before cliff', async function () {
      const { addr1, start, cliff, hardhatToken } = await loadFixture(deployTokenFixture);
      
      const TokenVesting = await ethers.getContractFactory("TokenVesting");
      const hardhatVesting = await TokenVesting.deploy(
        addr1.address, 
        start, 
        cliff, 
        RELEASE_RATE,
        0
      );

      await expect(
        hardhatVesting.release(hardhatToken.address)
      ).to.be.revertedWith('tokens cannot be released');
    });

    it('should properly release tokens during vesting period', async function () {
      const { hardhatVesting, hardhatToken, cliff, start, vestingPeriod, beneficiary } = await loadFixture(deployTokenFixture);
      
      const checkpoints = 6;

      for (let i = 0; i < checkpoints; i++) {
        const now = start + cliff + i * vestingPeriod;
        await time.increaseTo(now);

        await hardhatVesting.release(hardhatToken.address);

        const balance = await hardhatToken.balanceOf(beneficiary);
        const expectedVesting = await hardhatToken.balanceOf(beneficiary);

        expect(balance).to.equal(expectedVesting);
      }
    });

    it('cannot release more then vesting amount', async function () {
      const { hardhatVesting, hardhatToken, cliff, start, vestingPeriod, beneficiary } = await loadFixture(deployTokenFixture);
      
      const now = start + cliff + vestingPeriod * 10;
      await time.increaseTo(now);

      await hardhatVesting.release(hardhatToken.address);
      const balance = await hardhatToken.balanceOf(beneficiary);
      expect(balance).to.equal(VESTING_AMOUNT);
    });

    it('should release proper amount after cliff', async function () {
      const { hardhatVesting, hardhatToken, cliff, start, beneficiary } = await loadFixture(deployTokenFixture);
      
      const now = start + cliff;
      await time.increaseTo(now);
  
      await hardhatVesting.release(hardhatToken.address);
      const releaseTime = await time.latest();
  
      const balance = await hardhatToken.balanceOf(beneficiary);
      const monthsGone = Math.floor((releaseTime - now) / ONE_MONTH);

      expect(balance).to.equal(Math.floor((VESTING_AMOUNT * (RELEASE_RATE * monthsGone) / 100) + INITIAL_RELEASE_AMOUNT));
    });
  });
});