import { ethers } from "hardhat";

async function main() {
  const DECIMALS = 18;

  const now = Math.floor(new Date().getTime() / 1000);
  const ONE_MONTH = 60 * 60 * 24 * 30;
  const TOTAL_SUPPLY_LIMIT = 1500000000;
  const INITIAL_TOKEN_SUPPLY = 0;
  const PRE_SEED_TOKEN_ALLOCATION = 36000000; // 36 mln
  const SEED_TOKEN_ALLOCATION = 120000000; // 120 mln
  const SEED_TOTAL_TOKEN_ALLOCATION = PRE_SEED_TOKEN_ALLOCATION + SEED_TOKEN_ALLOCATION;

  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  console.log("Deploying token...");
  const MoonappToken = await ethers.getContractFactory("MoonappToken");
  const token = await MoonappToken.deploy(
    'MoonApp', 
    'XXX', 
    INITIAL_TOKEN_SUPPLY, 
    TOTAL_SUPPLY_LIMIT,
  );

  await token.deployed();

  console.log('Token address: ', token.address)

  console.log("Deploying Seed contract...");
  const Seed = await ethers.getContractFactory("Seed");
  const seed = await Seed.deploy(
    token.address,
    SEED_TOTAL_TOKEN_ALLOCATION
  );

  await seed.deployed();

  console.log("Transfering tokens to address: ", seed.address);
  await token.mint(seed.address, BigInt(SEED_TOTAL_TOKEN_ALLOCATION * (10 ** DECIMALS)));
  await token.lockMint(ONE_MONTH + now);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
