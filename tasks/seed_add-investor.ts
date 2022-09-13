import { task } from "hardhat/config";

task("seed-add-investor", "Adds investor to the seed")
  .addPositionalParam("seedAddress", "The seed contract address")
  .addPositionalParam("investor", "The investor address")
  .addPositionalParam("amount", "The amount of tokens")
  .setAction(async ({ seedAddress, investor, amount }, { ethers }) => {
    const seed = await ethers.getContractAt("Seed", seedAddress);

    const tx = await seed.addInvestor(investor, +amount);
    await tx.wait();

    console.log(`Welcome new investor ${investor} on board with ${amount} of tokens`);
  });
