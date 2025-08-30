import { ethers } from "ethers";
import contractData from "./abis/VeryfychainNFT.json"; // Ensure this path matches your project structure

// Deployed contract address on Sepolia
export const CONTRACT_ADDRESS =  0x20E5e3eBd09B576B9Cb57835037d5990Fa9d54E3; // Replace with your actual address

// Function to get the contract instance
export const getContract = (providerOrSigner) => {
  return new ethers.Contract(CONTRACT_ADDRESS, contractData.abi, providerOrSigner);
};

