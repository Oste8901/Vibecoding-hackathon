

import { ethers } from "ethers";
import contractData from "./abis/VeryfychainNFT.json";

// Replace with your deployed contract address
export const CONTRACT_ADDRESS = "0xA55D3D557332d196D3C7E813b0f9D6ec355Fe230";
 
// Get contract instance with signer (for write operations)
export const getContract = (signer) => {
  return new ethers.Contract(CONTRACT_ADDRESS, contractData.abi, signer);
};

// Get contract instance read-only (for reading owner, etc.)
export const getReadOnlyContract = () => {
  const provider = new ethers.JsonRpcProvider("Alchemy_SEPOLIA_RPC_URL");
  return new ethers.Contract(CONTRACT_ADDRESS, contractData.abi, provider);
};




