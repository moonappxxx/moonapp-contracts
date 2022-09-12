import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

import "./tasks/seed_add-investor";
import "./tasks/seed_release-tokens";

const config: HardhatUserConfig = {
  solidity: "0.8.9",
};

export default config;
