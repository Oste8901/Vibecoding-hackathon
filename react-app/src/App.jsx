import React, { useState } from "react";
import { ethers } from "ethers";
import detectEthereumProvider from "@metamask/detect-provider";
import { getContract, CONTRACT_ADDRESS } from "./contract";

function App() {
  const [account, setAccount] = useState(null);

  // Connect wallet button
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

  // Disconnect wallet button (clears state)
  const disconnectWallet = () => {
    setAccount(null);
  };

  // Issue credential button
  const issueCredential = async () => {
    if (!account) {
      alert("Please connect wallet first");
      return;
    }

    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const contract = getContract(signer);

      const tx = await contract.issueCredential(account, "ipfs://example-token-uri");
      await tx.wait();

      alert(`Credential issued! Transaction hash: ${tx.hash}`);
    } catch (err) {
      console.error(err);
      alert("Failed to issue credential");
    }
  };

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








