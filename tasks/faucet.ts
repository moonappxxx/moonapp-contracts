import { task } from "hardhat/config";

task("faucet", "Sends ETH to an address")
  .addPositionalParam("receiver", "The address that will receive them")
  .setAction(async ({ receiver }, { ethers }) => {
    const [sender] = await ethers.getSigners();

    const tx2 = await sender.sendTransaction({
      to: receiver,
      value: ethers.constants.WeiPerEther,
    });
    await tx2.wait();

    console.log(`Transferred 1 ETH to ${receiver}`);
  });
