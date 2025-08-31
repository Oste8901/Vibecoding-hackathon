// src/App.jsx
import React, { useEffect, useMemo, useState } from "react";
import { ethers } from "ethers";
import { getContract, CONTRACT_ADDRESS } from "./contract";
import QRCode from "react-qr-code";

export default function App() {
  const [account, setAccount] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [owner, setOwner] = useState(null);
  const [isOwner, setIsOwner] = useState(false);
  const [status, setStatus] = useState("");

  // Single-issue form
  const [recipient, setRecipient] = useState("");
  const [tokenURI, setTokenURI] = useState("");

  // Batch-issue form
  const [batchRecipientsText, setBatchRecipientsText] = useState(""); // newline/comma-separated
  const [batchUrisText, setBatchUrisText] = useState(""); // newline/comma-separated
  const [batchMintedURIs, setBatchMintedURIs] = useState([]); // store URIs of batch minted tokens

  // View by tokenId
  const [queryTokenId, setQueryTokenId] = useState("");
  const [queryOwner, setQueryOwner] = useState("");
  const [queryTokenURI, setQueryTokenURI] = useState("");

  // List tokens in range
  const [listFromId, setListFromId] = useState("1");
  const [listToId, setListToId] = useState("25");
  const [listed, setListed] = useState([]); // [{tokenId, owner, uri}]

  const transferTopic = useMemo(
    () => ethers.id("Transfer(address,address,uint256)"),
    []
  );

  const explorerBase = useMemo(() => {
    if (chainId === 11155111) return "https://sepolia.etherscan.io";
    if (chainId === 84532) return "https://sepolia.basescan.org";
    return "https://etherscan.io";
  }, [chainId]);

  // -------- helpers --------
  const getBrowserProvider = () => {
    if (!window.ethereum) {
      throw new Error("MetaMask not detected");
    }
    return new ethers.BrowserProvider(window.ethereum);
  };

  const connectWallet = async () => {
    try {
      const provider = getBrowserProvider();
      const accounts = await provider.send("eth_requestAccounts", []);
      const network = await provider.getNetwork();
      setAccount(ethers.getAddress(accounts[0]));
      setChainId(Number(network.chainId));
      setStatus("");
    } catch (err) {
      console.error(err);
      setStatus(err.message || "Failed to connect wallet");
    }
  };

  const disconnectWallet = () => {
    setAccount(null);
    setIsOwner(false);
    setStatus("");
  };

  const loadOwner = async () => {
    try {
      const provider = getBrowserProvider();
      const contract = getContract(provider);
      const ownerAddr = await contract.owner();
      setOwner(ethers.getAddress(ownerAddr));
      if (account && ownerAddr) {
        setIsOwner(ethers.getAddress(account) === ethers.getAddress(ownerAddr));
      } else {
        setIsOwner(false);
      }
    } catch (err) {
      console.error("loadOwner error:", err);
      setOwner(null);
      setIsOwner(false);
      setStatus("Error fetching contract owner");
    }
  };

  // Load owner + network when wallet changes
  useEffect(() => {
    (async () => {
      if (!window.ethereum) return;
      try {
        const provider = getBrowserProvider();
        const network = await provider.getNetwork();
        setChainId(Number(network.chainId));
      } catch {}
      await loadOwner();
    })();
  }, [account]);

  // MetaMask account/network change listeners
  useEffect(() => {
    if (!window.ethereum) return;
    const handleAccountsChanged = (accs) => {
      if (accs && accs.length > 0) {
        setAccount(ethers.getAddress(accs[0]));
      } else {
        disconnectWallet();
      }
    };
    const handleChainChanged = (_chainIdHex) => {
      const id = Number(_chainIdHex);
      setChainId(id);
      loadOwner();
    };
    window.ethereum.on?.("accountsChanged", handleAccountsChanged);
    window.ethereum.on?.("chainChanged", handleChainChanged);
    return () => {
      window.ethereum.removeListener?.("accountsChanged", handleAccountsChanged);
      window.ethereum.removeListener?.("chainChanged", handleChainChanged);
    };
  }, []);

  // -------- actions --------
  const issueCredential = async () => {
    setStatus("");
    if (!account) return alert("Connect wallet first");
    if (!isOwner) return alert("Only the contract owner can issue credentials");
    if (!ethers.isAddress(recipient)) return alert("Invalid recipient address");
    if (!tokenURI.trim()) return alert("Token URI is required");

    try {
      const provider = getBrowserProvider();
      const signer = await provider.getSigner();
      const contract = getContract(signer);

      const tx = await contract.issueCredential(recipient.trim(), tokenURI.trim());
      setStatus("Waiting for confirmation…");
      const rcpt = await tx.wait();

      const mintedIds = rcpt.logs
        .filter((log) => log.address.toLowerCase() === CONTRACT_ADDRESS.toLowerCase())
        .filter((log) => log.topics?.[0]?.toLowerCase() === transferTopic.toLowerCase())
        .map((log) => {
          try {
            return BigInt(log.topics[3]).toString();
          } catch {
            return null;
          }
        })
        .filter(Boolean);

      const link = `${explorerBase}/tx/${rcpt.hash}`;
      setStatus(
        `Issued! ${mintedIds.length ? `TokenId: ${mintedIds.join(", ")}` : ""} — View: ${link}`
      );
    } catch (err) {
      console.error("issueCredential error:", err);
      alert("Failed to issue credential: " + (err.reason || err.message));
    }
  };

  const issueBatch = async () => {
    setStatus("");
    setBatchMintedURIs([]);
    if (!account) return alert("Connect wallet first");
    if (!isOwner) return alert("Only the contract owner can issue credentials");

    const split = (t) =>
      t
        .split(/[\n,]+/g)
        .map((s) => s.trim())
        .filter(Boolean);

    const recipients = split(batchRecipientsText);
    const uris = split(batchUrisText);

    if (recipients.length === 0) return alert("No recipients");
    if (recipients.some((a) => !ethers.isAddress(a))) return alert("One or more recipient addresses are invalid");
    if (uris.length !== recipients.length) return alert("Recipients and URIs must have the same count");

    try {
      const provider = getBrowserProvider();
      const signer = await provider.getSigner();
      const contract = getContract(signer);

      const tx = await contract.issueBatchCredentials(recipients, uris);
      setStatus("Waiting for batch confirmation…");
      const rcpt = await tx.wait();

      setBatchMintedURIs(uris);

      const mintedIds = rcpt.logs
        .filter((log) => log.address.toLowerCase() === CONTRACT_ADDRESS.toLowerCase())
        .filter((log) => log.topics?.[0]?.toLowerCase() === transferTopic.toLowerCase())
        .map((log) => {
          try {
            return BigInt(log.topics[3]).toString();
          } catch {
            return null;
          }
        })
        .filter(Boolean);

      const link = `${explorerBase}/tx/${rcpt.hash}`;
      setStatus(`Batch issued! TokenIds: ${mintedIds.join(", ")} — View: ${link}`);
    } catch (err) {
      console.error("issueBatch error:", err);
      alert("Failed to batch issue: " + (err.reason || err.message));
    }
  };

  const lookupToken = async () => {
    setQueryOwner("");
    setQueryTokenURI("");
    setStatus("");
    if (!queryTokenId.trim()) return;

    try {
      const provider = getBrowserProvider();
      const contract = getContract(provider);
      const tid = queryTokenId.trim();
      const [own, uri] = await Promise.all([contract.ownerOf(tid), contract.tokenURI(tid)]);
      setQueryOwner(ethers.getAddress(own));
      setQueryTokenURI(uri);
    } catch (err) {
      console.error("lookupToken error:", err);
      setStatus("Lookup failed: " + (err.reason || err.message));
    }
  };

  const listRange = async () => {
    setListed([]);
    setStatus("");
    const from = Number(listFromId);
    const to = Number(listToId);
    if (!Number.isFinite(from) || !Number.isFinite(to) || from < 1 || to < from) {
      return alert("Enter a valid tokenId range (e.g., 1 to 25)");
    }
    try {
      const provider = getBrowserProvider();
      const contract = getContract(provider);
      const out = [];
      for (let i = from; i <= to; i++) {
        try {
          const [own, uri] = await Promise.all([contract.ownerOf(i), contract.tokenURI(i)]);
          out.push({ tokenId: i, owner: ethers.getAddress(own), uri });
        } catch {
          // token may not exist; skip
        }
      }
      setListed(out);
      if (out.length === 0) setStatus("No tokens found in that range.");
    } catch (err) {
      console.error("listRange error:", err);
      setStatus("List failed: " + (err.reason || err.message));
    }
  };

  // -------- UI --------
  return (
    <div style={{ padding: "24px", maxWidth: 900, margin: "0 auto", fontFamily: "system-ui, sans-serif" }}>
      <h1>VeryfychainNFT Demo</h1>

      {/* Wallet + network */}
      <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        {account ? (
          <>
            <div><strong>Connected:</strong> {account}</div>
            <button onClick={disconnectWallet}>Disconnect</button>
          </>
        ) : (
          <button onClick={connectWallet}>Connect Wallet</button>
        )}
        <div>
          <strong>Network:</strong>{" "}
          {chainId ? (
            chainId === 11155111 ? "Sepolia" : chainId === 84532 ? "Base Sepolia" : `Chain ${chainId}`
          ) : (
            "—"
          )}
        </div>
        <div><strong>Contract:</strong> {CONTRACT_ADDRESS}</div>
      </div>

      <div style={{ marginTop: 8 }}>
        <strong>Contract Owner:</strong>{" "}
        {owner ? owner : account ? "Loading…" : "Connect to load"}
        {owner && account && (
          <span style={{ marginLeft: 12 }}>
            {isOwner ? "✅ You are the owner" : "⛔ You are not the owner"}
          </span>
        )}
      </div>

      {status && (
        <div style={{ marginTop: 12, padding: 10, background: "#fff7d6", border: "1px solid #eedc9a" }}>
          {status}
        </div>
      )}

      <hr style={{ margin: "24px 0" }} />

      {/* Admin-only actions */}
      <section>
        <h2>Admin Actions</h2>
        {!account && <div>Connect your wallet to continue.</div>}
        {account && !isOwner && (
          <div style={{ color: "#b00" }}>
            Your wallet is not the contract owner. Issuance is disabled.
          </div>
        )}

        {/* Single issue */}
        <fieldset style={{ marginTop: 12, padding: 12 }}>
          <legend><strong>Issue Single Credential</strong></legend>
          <div style={{ display: "grid", gap: 8 }}>
            <label>
              Recipient Address
              <input
                style={{ width: "100%" }}
                placeholder="0xRecipient..."
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
              />
            </label>
            <label>
              Token URI
              <input
                style={{ width: "100%" }}
                placeholder='e.g. ipfs://bafy... or data:application/json;base64,eyJ...'
                value={tokenURI}
                onChange={(e) => setTokenURI(e.target.value)}
              />
            </label>
            <button disabled={!account || !isOwner} onClick={issueCredential}>
              Issue Credential
            </button>
          </div>
        </fieldset>

        {/* Batch issue */}
        <fieldset style={{ marginTop: 12, padding: 12 }}>
          <legend><strong>Batch Issue Credentials</strong></legend>
          <div style={{ display: "grid", gap: 8 }}>
            <label>
              Recipients (comma or newline separated)
              <textarea
                rows={4}
                placeholder={"0xabc...\n0xdef...\n0x123..."}
                value={batchRecipientsText}
                onChange={(e) => setBatchRecipientsText(e.target.value)}
                style={{ width: "100%" }}
              />
            </label>
            <label>
              Token URIs (comma or newline separated; must match recipients count)
              <textarea
                rows={4}
                placeholder={"ipfs://...\nipfs://...\nipfs://..."}
                value={batchUrisText}
                onChange={(e) => setBatchUrisText(e.target.value)}
                style={{ width: "100%" }}
              />
            </label>
            <button disabled={!account || !isOwner} onClick={issueBatch}>
              Batch Issue
            </button>

            {/* Display QR codes for batch minted URIs */}
            {batchMintedURIs.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <strong>QR Codes for Batch Minted Tokens:</strong>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 8 }}>
                  {batchMintedURIs.map((uri, idx) => (
                    <div key={idx} style={{ textAlign: "center", padding: 6, border: "1px solid #ddd" }}>
                      <QRCode value={uri} size={128} />
                      <div style={{ marginTop: 4, wordBreak: "break-all", fontSize: 12 }}>{uri}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </fieldset>
      </section>

      <hr style={{ margin: "24px 0" }} />

      {/* Read-only tools */}
      <section>
        <h2>Verify Credentials</h2>

        <fieldset style={{ marginTop: 12, padding: 12 }}>
          <legend><strong>Lookup by Token ID</strong></legend>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <input
              style={{ flex: "0 0 200px" }}
              placeholder="Token ID"
              value={queryTokenId}
              onChange={(e) => setQueryTokenId(e.target.value)}
            />
            <button onClick={lookupToken}>Lookup</button>
          </div>
          <div style={{ marginTop: 8 }}>
            <div><strong>Owner:</strong> {queryOwner || "—"}</div>
            <div style={{ marginTop: 6 }}>
              <strong>Token URI:</strong>{" "}
              {queryTokenURI ? (
                <span style={{ wordBreak: "break-all" }}>{queryTokenURI}</span>
              ) : (
                "—"
              )}
            </div>
            {/* QR code for single token URI */}
            {queryTokenURI && (
              <div style={{ marginTop: 8, padding: 6, border: "1px solid #ddd", display: "inline-block" }}>
                <QRCode value={queryTokenURI} size={128} />
              </div>
            )}
          </div>
        </fieldset>

        <fieldset style={{ marginTop: 12, padding: 12 }}>
          <legend><strong>List Tokens in Range</strong></legend>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <input
              style={{ width: 120 }}
              placeholder="From ID"
              value={listFromId}
              onChange={(e) => setListFromId(e.target.value)}
            />
            <input
              style={{ width: 120 }}
              placeholder="To ID"
              value={listToId}
              onChange={(e) => setListToId(e.target.value)}
            />
            <button onClick={listRange}>List</button>
          </div>
          <div style={{ marginTop: 10 }}>
            {listed.length === 0 ? (
              <div>—</div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={{ borderBottom: "1px solid #ddd", textAlign: "left", padding: 6 }}>Token ID</th>
                    <th style={{ borderBottom: "1px solid #ddd", textAlign: "left", padding: 6 }}>Owner</th>
                    <th style={{ borderBottom: "1px solid #ddd", textAlign: "left", padding: 6 }}>Token URI</th>
                  </tr>
                </thead>
                <tbody>
                  {listed.map((row) => (
                    <tr key={row.tokenId}>
                      <td style={{ borderBottom: "1px solid #eee", padding: 6 }}>{row.tokenId}</td>
                      <td style={{ borderBottom: "1px solid #eee", padding: 6, wordBreak: "break-all" }}>
                        {row.owner}
                      </td>
                      <td style={{ borderBottom: "1px solid #eee", padding: 6, wordBreak: "break-all" }}>
                        {row.uri}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          <div style={{ marginTop: 8, fontSize: 12, color: "#666" }}>
            Note: Non-existent tokens are skipped.
          </div>
        </fieldset>
      </section>
    </div>
  );
}

