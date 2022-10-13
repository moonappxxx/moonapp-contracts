import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from 'dotenv';
dotenv.config();

import "./tasks/faucet";
import "./tasks/token_mint";
import "./tasks/seed_add-investor";
import "./tasks/seed_release-tokens";

const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY;
const ETH_MAINNET_RPC_URL = process.env.ETH_MAINNET_RPC_URL;
const GOERLI_PRIVATE_KEY = process.env.GOERLI_PRIVATE_KEY;
const ETH_MAINNET_PRIVATE_KEY = process.env.ETH_MAINNET_PRIVATE_KEY;

const config: HardhatUserConfig = {
  solidity: "0.8.9",
  networks: {
    hardhat: {},
    goerli: {
      url: `https://eth-goerli.alchemyapi.io/v2/${ALCHEMY_API_KEY}`,
      accounts: [GOERLI_PRIVATE_KEY as string],
    },
    mainnet: {
      url: ETH_MAINNET_RPC_URL,
      accounts: [ETH_MAINNET_PRIVATE_KEY as string],
    },
  }
};

export default config;
