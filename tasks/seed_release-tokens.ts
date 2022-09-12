import { task } from "hardhat/config";

task("seed-release-tokens", "Release tokens")
  .addPositionalParam("seedAddress", "The seed contract address")
  .addPositionalParam("releaseRate", "The percentage of tokens to be released every month")
  .addPositionalParam("initiallyReleaseRate", "The percentage of tokens to be initially released")
  .setAction(async ({ seedAddress, releaseRate, initiallyReleaseRate }, { ethers }) => {
    const ONE_MONTH = 60 * 60 * 24 * 30;

    const seed = await ethers.getContractAt("Seed", seedAddress);
    
    const currentTimestampInSeconds = Math.round(Date.now() / 1000);
    const start = currentTimestampInSeconds;
    const cliff = ONE_MONTH;

    const tx = await seed.releaseTokens(start, cliff, releaseRate, initiallyReleaseRate);
    await tx.wait();

    console.log(`Tokens released, initially released percentage: ${initiallyReleaseRate}, monthly release percentage: ${releaseRate}`);
  });