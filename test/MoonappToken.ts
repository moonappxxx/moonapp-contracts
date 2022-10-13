import { ethers } from "hardhat";
import { expect } from "chai";
import { loadFixture, time } from"@nomicfoundation/hardhat-network-helpers";

const TOTAL_SUPPLY_LIMIT = 10000;
const INITIAL_TOKEN_SUPPLY = 1000;
const ONE_MONTH = 60 * 60 * 24 * 30;

describe("MoonappToken", function () {
  async function deployTokenFixture() {
    const MoonappToken = await ethers.getContractFactory("MoonappToken");
    const [owner, addr1, addr2] = await ethers.getSigners();

    const hardhatToken = await MoonappToken.deploy(
      'MoonappToken', 
      'XXX', 
      INITIAL_TOKEN_SUPPLY, 
      TOTAL_SUPPLY_LIMIT,
    );

    await hardhatToken.deployed();
    return { MoonappToken, hardhatToken, owner, addr1, addr2 };
  }

  describe("Deployment", function() {
    it("Should assign the total supply of tokens to the owner", async function () {
      const { hardhatToken, owner } = await loadFixture(deployTokenFixture);
      const ownerBalance = await hardhatToken.balanceOf(owner.address);
      expect(await hardhatToken.totalSupply()).to.equal(ownerBalance);
    });

    it("Should assign the total supply limit", async function () {
      const { hardhatToken } = await loadFixture(deployTokenFixture);
      expect(await hardhatToken.totalSupplyLimit()).to.equal(BigInt(TOTAL_SUPPLY_LIMIT * (10 ** 18)));
    });
  });
  
  describe("Mint", function() {
    it("can be minted by admin only", async function () {
      const { hardhatToken, owner, addr1} = await loadFixture(deployTokenFixture);

      await expect(
        hardhatToken.connect(addr1).mint(owner.address, 10)
      ).to.be.revertedWith("Only Governor can call");
    });

    it("cannot be minted when locked", async function () {
      const { hardhatToken, addr1} = await loadFixture(deployTokenFixture);

      const now = await time.latest();

      await hardhatToken.lockMint(ONE_MONTH + now);
      await expect(
        hardhatToken.lockMint((ONE_MONTH * 2) + now)
      ).to.be.revertedWith("mint is locked");

      await expect(
        hardhatToken.mint(addr1.address, 10)
      ).to.be.revertedWith("mint is locked");
    });

    it("cannot mint more then total supply limit", async function () {
      const { hardhatToken, owner, addr1} = await loadFixture(deployTokenFixture);
      
      await expect(
        hardhatToken.mint(owner.address, BigInt(TOTAL_SUPPLY_LIMIT * (10 ** 18) + 10))
      ).to.be.revertedWith("We are reached the limit in the total supply");
    });
  });

  describe("Transactions", function () {
    it("Should transfer tokens between accounts", async function () {
      const { hardhatToken, owner, addr1, addr2 } = await loadFixture(
        deployTokenFixture
      );

      await expect(
        hardhatToken.transfer(addr1.address, 50)
      ).to.changeTokenBalances(hardhatToken, [owner, addr1], [-50, 50]);

      await expect(
        hardhatToken.connect(addr1).transfer(addr2.address, 50)
      ).to.changeTokenBalances(hardhatToken, [addr1, addr2], [-50, 50]);
    });

    it("should emit Transfer events", async function () {
      const { hardhatToken, owner, addr1, addr2 } = await loadFixture(
        deployTokenFixture
      );

      await expect(hardhatToken.transfer(addr1.address, 50))
        .to.emit(hardhatToken, "Transfer")
        .withArgs(owner.address, addr1.address, 50);

      await expect(hardhatToken.connect(addr1).transfer(addr2.address, 50))
        .to.emit(hardhatToken, "Transfer")
        .withArgs(addr1.address, addr2.address, 50);
    });

    it("Should fail if sender doesn't have enough tokens", async function () {
      const { hardhatToken, owner, addr1 } = await loadFixture(
        deployTokenFixture
      );
      const initialOwnerBalance = await hardhatToken.balanceOf(owner.address);

      await expect(
        hardhatToken.connect(addr1).transfer(owner.address, 1)
      ).to.be.revertedWith("ERC20: transfer amount exceeds balance");

      expect(await hardhatToken.balanceOf(owner.address)).to.equal(
        initialOwnerBalance
      );
    });
  });

});