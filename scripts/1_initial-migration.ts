import { ethers } from "hardhat";

async function main() {
  const Migrations = await ethers.getContractFactory("Migrations");
  const migrations = await Migrations.deploy();

  await migrations.deployed();

  console.log(`Initial migration`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
