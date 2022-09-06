import { ethers } from "hardhat";
import { expect } from "chai";
import { loadFixture, time } from"@nomicfoundation/hardhat-network-helpers";

const TOTAL_SUPPLY_LIMIT = 100000;
const INITIAL_TOKEN_SUPPLY = 0;
const SEED_AVAILABLE_TOKENS = 5000;
const ONE_MONTH = 60 * 60 * 24 * 30;
const INITIAL_RELEASE_RATE = 10;
const RELEASE_RATE = 15;

describe("Seed", function () {
  async function deployTokenFixture() {
    const MoonappToken = await ethers.getContractFactory("MoonappToken");
    const Seed = await ethers.getContractFactory("Seed");
    const [owner, addr1, addr2] = await ethers.getSigners();

    const start = await time.latest();
    const cliff = ONE_MONTH;

    const hardhatToken = await MoonappToken.deploy(
      'MoonappToken', 
      'XXX', 
      INITIAL_TOKEN_SUPPLY, 
      TOTAL_SUPPLY_LIMIT,
    );

    await hardhatToken.deployed();

    const hardhatSeed = await Seed.deploy(
      hardhatToken.address,
      SEED_AVAILABLE_TOKENS
    );
    await hardhatSeed.deployed();

    await hardhatToken.mint(hardhatSeed.address, SEED_AVAILABLE_TOKENS);

    return { MoonappToken, hardhatToken, hardhatSeed, owner, addr1, addr2, start, cliff };
  }

  describe("Deployment", function() {
    it("Should set the right admin", async function () {
      const { hardhatSeed, owner } = await loadFixture(deployTokenFixture);
      expect(await hardhatSeed.admin()).to.equal(owner.address);
    });

    it("Should set the right amount of tokens", async function () {
      const { hardhatSeed } = await loadFixture(deployTokenFixture);
      expect(await hardhatSeed.availableTokens()).to.equal(SEED_AVAILABLE_TOKENS);
    });
  });

  describe("Governance", function() {
    it("cannot change admin without permission", async function () {
      const { hardhatSeed, owner, addr1 } = await loadFixture(deployTokenFixture);
      await hardhatSeed.changeAdmin(addr1.address);
      
      await expect(
        hardhatSeed.changeAdmin(owner.address)
      ).to.be.revertedWith('only admin');
    });
    
    it("Should correctly change admin", async function () {
      const { hardhatSeed, addr1 } = await loadFixture(deployTokenFixture);
      await hardhatSeed.changeAdmin(addr1.address);
      expect(await hardhatSeed.admin()).to.equal(addr1.address);
    });

    it("cannot add investor without permission", async function () {
      const { hardhatSeed, addr1, addr2 } = await loadFixture(deployTokenFixture);
      await hardhatSeed.changeAdmin(addr1.address);
      
      await expect(
        hardhatSeed.addInvestor(addr2.address, 1000)
      ).to.be.revertedWith('only admin');
    });

    it("cannot release tokens without permission", async function () {
      const { hardhatSeed, addr1, start, cliff } = await loadFixture(deployTokenFixture);
      await hardhatSeed.changeAdmin(addr1.address);
      
      await expect(
        hardhatSeed.releaseTokens(start, cliff, RELEASE_RATE, INITIAL_RELEASE_RATE)
      ).to.be.revertedWith('only admin');
    });

    it("Should correctly handle investor requirements", async function () {
      const { hardhatSeed, addr1 } = await loadFixture(deployTokenFixture);

      await expect(
        hardhatSeed.addInvestor('0x0000000000000000000000000000000000000000', 1000)
      ).to.be.revertedWith("ADD_INVESTOR: The investors's address cannot be 0");
      
      await expect(
        hardhatSeed.addInvestor(addr1.address, 0)
      ).to.be.revertedWith("ADD_INVESTOR: only investors.");

      await expect(
        hardhatSeed.addInvestor(addr1.address, SEED_AVAILABLE_TOKENS + 5)
      ).to.be.revertedWith("ADD_INVESTOR: not enought tokens left.");

      await hardhatSeed.addInvestor(addr1.address, 1000);

      await expect(
        hardhatSeed.addInvestor(addr1.address, 1000)
      ).to.be.revertedWith("ADD_INVESTOR: you can add investor only once.");
    });

    it("Should add investors with correct data", async function () {
      const { hardhatSeed, addr1, addr2 } = await loadFixture(deployTokenFixture);

      // First investor
      await hardhatSeed.addInvestor(addr1.address, 1000);
      const investorTokens = await hardhatSeed.investorTokens(addr1.address);
      expect(investorTokens).to.equal(1000);
      
      const investorAddress = await hardhatSeed.investors(0);
      expect(investorAddress).to.equal(addr1.address);

      // Second investor
      await hardhatSeed.addInvestor(addr2.address, 3000);
      const investor2Tokens = await hardhatSeed.investorTokens(addr2.address);
      expect(investor2Tokens).to.equal(3000);
      
      const investor2Address = await hardhatSeed.investors(1);
      expect(investor2Address).to.equal(addr2.address);
    });
  });

  describe("Release", function() {
    it("doesn't release tokens before cliff", async function () {
      const { hardhatSeed, hardhatToken, addr1, start, cliff } = await loadFixture(deployTokenFixture);

      const investedAmount = 1000;

      await hardhatSeed.addInvestor(addr1.address, investedAmount);
      await hardhatSeed.releaseTokens(start, cliff, RELEASE_RATE, INITIAL_RELEASE_RATE);
      
      expect(await hardhatToken.balanceOf(addr1.address)).to.equal(Math.floor(investedAmount * INITIAL_RELEASE_RATE / 100));
    });

    it("Should set correct start time", async function () {
      const { hardhatSeed, addr1, start, cliff } = await loadFixture(deployTokenFixture);

      const investedAmount = 1000;

      await hardhatSeed.addInvestor(addr1.address, investedAmount);
      await hardhatSeed.releaseTokens(start, cliff, RELEASE_RATE, INITIAL_RELEASE_RATE);
      
      expect(await hardhatSeed.startTime()).to.equal(start);
    });

    it("cannot be released twice", async function () {
      const { hardhatSeed, addr1, start, cliff } = await loadFixture(deployTokenFixture);

      const investedAmount = 1000;

      await hardhatSeed.addInvestor(addr1.address, investedAmount);
      await hardhatSeed.releaseTokens(start, cliff, RELEASE_RATE, INITIAL_RELEASE_RATE);
      
      await expect(
        hardhatSeed.releaseTokens(start, cliff, RELEASE_RATE, INITIAL_RELEASE_RATE)
      ).to.be.revertedWith("tokens already released");
    });
  });

});