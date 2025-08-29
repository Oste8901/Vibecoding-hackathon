// src/contract.js

import { ethers } from 'ethers';
import VeryfychainNFT from './abis/VeryfychainNFT.json'; // make sure the path is correct

// Hardcoded contract address (replace with your deployed address)
export const CONTRACT_ADDRESS = '0xB13417C6fc0cD7dA43a0EFAA8D999D850862d48B';

// Function to get the contract instance
export const getContract = (providerOrSigner) => {
  return new ethers.Contract(CONTRACT_ADDRESS, VeryfychainNFT.abi, providerOrSigner);
};
