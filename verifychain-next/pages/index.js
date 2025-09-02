import { useState, useEffect } from "react";
import { ethers } from "ethers";
import detectEthereumProvider from "@metamask/detect-provider";
import { getContract, getReadOnlyContract } from "../lib/contract";

export default function Home() {
  const [account, setAccount] = useState(null);
  const [owner, setOwner] = useState("Loading...");
  const [loading, setLoading] = useState(false);

  // Admin states
  const [recipient, setRecipient] = useState("");
  const [tokenURI, setTokenURI] = useState("");
  const [batchRecipients, setBatchRecipients] = useState("");
  const [batchURIs, setBatchURIs] = useState("");
  const [adminMsg, setAdminMsg] = useState("");

  // Verify states
  const [lookupId, setLookupId] = useState("");
  const [lookupResult, setLookupResult] = useState(null);
  const [rangeStart, setRangeStart] = useState("");
  const [rangeEnd, setRangeEnd] = useState("");
  const [rangeResult, setRangeResult] = useState([]);
  const [verifyMsg, setVerifyMsg] = useState("");

  // Wallet connect
  const connectWallet = async () => {
    const provider = await detectEthereumProvider();
    if (!provider) return alert("MetaMask not detected");

    try {
      const accounts = await provider.request({ method: "eth_requestAccounts" });
      setAccount(accounts[0]);
    } catch (err) {
      console.error(err);
      alert("Failed to connect wallet");
    }
  };
  const disconnectWallet = () => setAccount(null);

  // Issue single credential
  const issueCredential = async () => {
    if (!account) return setAdminMsg("Please connect wallet first");
    setLoading(true);
    setAdminMsg("Processing...");

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = getContract(signer);

      const tx = await contract.issueCredential(recipient, tokenURI);
      await tx.wait();

      setAdminMsg(`✅ Credential issued! Tx: ${tx.hash}`);
    } catch (err) {
      console.error(err);
      setAdminMsg("❌ Failed: " + (err.reason || err.message));
    } finally {
      setLoading(false);
    }
  };

  // Issue batch credentials
  const issueBatch = async () => {
    if (!account) return setAdminMsg("Please connect wallet first");
    setLoading(true);
    setAdminMsg("Processing...");

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = getContract(signer);

      const recipients = batchRecipients.split(/\s|,/).filter(Boolean);
      const uris = batchURIs.split(/\s|,/).filter(Boolean);

      const tx = await contract.issueBatchCredentials(recipients, uris);
      await tx.wait();

      setAdminMsg(`✅ Batch issued! Tx: ${tx.hash}`);
    } catch (err) {
      console.error(err);
      setAdminMsg("❌ Failed: " + (err.reason || err.message));
    } finally {
      setLoading(false);
    }
  };

  // Lookup by token ID
  const lookupToken = async () => {
    setVerifyMsg("Looking up...");
    try {
      const contract = getReadOnlyContract();
      const ownerAddr = await contract.ownerOf(lookupId);
      const uri = await contract.tokenURI(lookupId);
      setLookupResult({ owner: ownerAddr, uri });
      setVerifyMsg("✅ Lookup successful");
    } catch (err) {
      console.error(err);
      setLookupResult(null);
      setVerifyMsg("❌ Error: " + (err.reason || err.message));
    }
  };

  // List tokens in range
  const listTokens = async () => {
    setVerifyMsg("Fetching range...");
    try {
      const contract = getReadOnlyContract();
      const results = [];
      for (let i = Number(rangeStart); i <= Number(rangeEnd); i++) {
        try {
          const ownerAddr = await contract.ownerOf(i);
          const uri = await contract.tokenURI(i);
          results.push({ id: i, owner: ownerAddr, uri });
        } catch (err) {
          // skip nonexistent token
        }
      }
      setRangeResult(results);
      setVerifyMsg("✅ Range fetched");
    } catch (err) {
      console.error(err);
      setRangeResult([]);
      setVerifyMsg("❌ Error: " + (err.reason || err.message));
    }
  };

  // Fetch contract owner
  useEffect(() => {
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
    fetchOwner();
  }, []);

  // Inline styles
  const pageStyle = {
    minHeight: "100vh",
    backgroundColor: "#0f172a",
    color: "#fff",
    padding: "20px",
    fontFamily: "Segoe UI, Tahoma, Geneva, Verdana, sans-serif",
  };
  const headerStyle = {
    background: "linear-gradient(to right, #4f46e5, #06b6d4)",
    padding: "15px 20px",
    borderRadius: "12px",
    marginBottom: "20px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  };
  const sectionWrapper = {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "20px",
  };
  const cardStyle = {
    backgroundColor: "#1e293b",
    borderRadius: "12px",
    padding: "20px",
    boxShadow: "0 6px 16px rgba(0,0,0,0.3)",
  };
  const inputStyle = {
    width: "100%",
    padding: "10px",
    borderRadius: "8px",
    border: "1px solid #475569",
    marginBottom: "10px",
    background: "#0f172a",
    color: "#fff",
  };
  const buttonStyle = {
    padding: "10px",
    borderRadius: "8px",
    border: "none",
    fontWeight: "bold",
    cursor: "pointer",
    background: "linear-gradient(to right, #3b82f6, #2563eb)",
    color: "#fff",
    marginBottom: "10px",
    width: "100%",
  };
  const msgBox = {
    padding: "10px",
    borderRadius: "6px",
    background: "#334155",
    marginTop: "10px",
    wordBreak: "break-word",
  };

  return (
    <div style={pageStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <h2>VerifychainNFT · Sepolia</h2>
        {account ? (
          <button style={{ ...buttonStyle, background: "#ef4444" }} onClick={disconnectWallet}>
            Disconnect
          </button>
        ) : (
          <button style={buttonStyle} onClick={connectWallet}>
            Connect Wallet
          </button>
        )}
      </div>

      {/* Wallet & Owner */}
      <div style={{ marginBottom: "20px" }}>
        <p>Network: <strong>Sepolia</strong></p>
        <p>Owner: {owner}</p>
        {account && <p>Connected Wallet: {account}</p>}
      </div>

      {/* Two Columns */}
      <div style={sectionWrapper}>
        {/* Left: Admin Actions */}
        <div style={cardStyle}>
          <h3>Admin Actions</h3>
          <p style={{ fontSize: "14px", marginBottom: "10px" }}>
            Issue credentials as the contract owner. Batch issuing supports comma/newline separated lists.
          </p>

          {/* Single Issue */}
          <input
            style={inputStyle}
            placeholder="0xRecipient..."
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
          />
          <input
            style={inputStyle}
            placeholder="ipfs://... or data:application/json;base64,..."
            value={tokenURI}
            onChange={(e) => setTokenURI(e.target.value)}
          />
          <button style={buttonStyle} onClick={issueCredential} disabled={loading}>
            {loading ? "Issuing..." : "Issue Credential"}
          </button>

          {/* Batch Issue */}
          <textarea
            style={{ ...inputStyle, height: "80px" }}
            placeholder="Recipients (comma or newline separated)"
            value={batchRecipients}
            onChange={(e) => setBatchRecipients(e.target.value)}
          />
          <textarea
            style={{ ...inputStyle, height: "80px" }}
            placeholder="Token URIs (must match recipient count)"
            value={batchURIs}
            onChange={(e) => setBatchURIs(e.target.value)}
          />
          <button style={buttonStyle} onClick={issueBatch} disabled={loading}>
            {loading ? "Issuing..." : "Batch Issue"}
          </button>

          {adminMsg && <div style={msgBox}>{adminMsg}</div>}
        </div>

        {/* Right: Verify & Explore */}
        <div style={cardStyle}>
          <h3>Verify & Explore</h3>

          {/* Lookup */}
          <input
            style={inputStyle}
            placeholder="Token ID"
            value={lookupId}
            onChange={(e) => setLookupId(e.target.value)}
          />
          <button style={buttonStyle} onClick={lookupToken}>
            Lookup
          </button>
          {lookupResult && (
            <div style={msgBox}>
              <p><strong>Owner:</strong> {lookupResult.owner}</p>
              <p><strong>Token URI:</strong> {lookupResult.uri}</p>
            </div>
          )}

          {/* Range */}
          <div style={{ display: "flex", gap: "10px" }}>
            <input
              style={inputStyle}
              placeholder="Start ID"
              value={rangeStart}
              onChange={(e) => setRangeStart(e.target.value)}
            />
            <input
              style={inputStyle}
              placeholder="End ID"
              value={rangeEnd}
              onChange={(e) => setRangeEnd(e.target.value)}
            />
          </div>
          <button style={buttonStyle} onClick={listTokens}>
            List
          </button>
          {rangeResult.length > 0 && (
            <div style={msgBox}>
              {rangeResult.map((t) => (
                <div key={t.id} style={{ marginBottom: "8px" }}>
                  <strong>ID {t.id}:</strong> {t.owner} <br />
                  URI: {t.uri}
                </div>
              ))}
            </div>
          )}
          {verifyMsg && <div style={msgBox}>{verifyMsg}</div>}
        </div>
      </div>
    </div>
  );
}
