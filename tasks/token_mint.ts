import { task } from "hardhat/config";

task("token-mint", "Mint tokens to the given address")
  .addPositionalParam("tokenAddress", "The token address")
  .addPositionalParam("beneficiary", "The beneficiary address")
  .addPositionalParam("amount", "The amount of tokens")
  .setAction(async ({ tokenAddress, beneficiary, amount }, { ethers }) => {
    const token = await ethers.getContractAt("MoonappToken", tokenAddress);

    const tx = await token.mint(beneficiary, BigInt(amount * (10 ** 18)));
    await tx.wait();

    console.log(`${amount} of tokens minted to the ${beneficiary} address`);
  });
