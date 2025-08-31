import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import detectEthereumProvider from "@metamask/detect-provider";
import { getContract, getReadOnlyContract } from "./contract";

function App() {
  const [account, setAccount] = useState(null);
  const [owner, setOwner] = useState("Loading...");

  // Connect wallet
  const connectWallet = async () => {
    const provider = await detectEthereumProvider();
    if (!provider) {
      alert("MetaMask not detected");
      return;
    }

    try {
      const accounts = await provider.request({ method: "eth_requestAccounts" });
      setAccount(accounts[0]);
    } catch (err) {
      console.error(err);
      alert("Failed to connect wallet");
    }
  };

  // Disconnect wallet
  const disconnectWallet = () => {
    setAccount(null);
  };

  // Issue credential
  const issueCredential = async () => {
    if (!account) {
      alert("Please connect wallet first");
      return;
    }

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = getContract(signer);

      const tx = await contract.issueCredential(account, "ipfs://example-token-uri");
      await tx.wait();

      alert(`Credential issued! Transaction hash: ${tx.hash}`);
    } catch (err) {
      console.error("Full error:", err);
      alert("Failed to issue credential: " + (err.reason || err.message));
    }
  };

  // Fetch contract owner
  const fetchOwner = async () => {
    try {
      const contract = getReadOnlyContract();
      const ownerAddress = await contract.owner();
      setOwner(ownerAddress);
    } catch (err) {
      console.error(err);
      setOwner("Error fetching owner");
    }
  };

  useEffect(() => {
    fetchOwner();
  }, []);

  return (
    <div style={{ padding: "2rem" }}>
      <h1>VeryfychainNFT Demo</h1>

      {account ? (
        <div>
          <p>Connected Wallet: {account}</p>
          <button onClick={disconnectWallet}>Disconnect Wallet</button>
        </div>
      ) : (
        <button onClick={connectWallet}>Connect Wallet</button>
      )}

      <hr />

      <p>Contract Owner: {owner}</p>

      <button
        onClick={issueCredential}
        disabled={!account}
        style={{ marginTop: "1rem" }}
      >
        Issue Credential
      </button>
    </div>
  );
}

export default App; 



