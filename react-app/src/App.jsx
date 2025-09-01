// src/App.jsx
import React, { useEffect, useMemo, useState } from "react";
import { ethers } from "ethers";
import { getContract, CONTRACT_ADDRESS } from "./contract";
import QRCode from "react-qr-code";

/* ------------------------------ UI Styles ------------------------------ */
const ui = {
  page: {
    fontFamily: "Inter, system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, 'Helvetica Neue', Arial, 'Noto Sans', 'Apple Color Emoji', 'Segoe UI Emoji'",
    background: "linear-gradient(180deg, #0f172a 0%, #0b1220 100%)",
    minHeight: "100vh",
    color: "#0f172a",
  },
  container: {
    maxWidth: 1100,
    margin: "0 auto",
    padding: "28px 20px 60px",
  },
  nav: {
    background: "linear-gradient(90deg, #4f46e5, #0ea5e9)",
    borderRadius: 20,
    padding: 18,
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
  },
  brand: { fontSize: 20, fontWeight: 700, letterSpacing: 0.3 },
  subbrand: { opacity: 0.9, fontSize: 12, fontWeight: 500 },
  navRight: { display: "flex", gap: 12, alignItems: "center" },

  grid: {
    marginTop: 18,
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: 16,
  },
  twoCol: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: 16,
  },
  card: {
    background: "rgba(255,255,255,0.98)",
    borderRadius: 16,
    padding: 18,
    boxShadow: "0 12px 30px rgba(15,23,42,0.18)",
    border: "1px solid rgba(15,23,42,0.06)",
  },
  title: { fontSize: 18, fontWeight: 700, color: "#0f172a" },
  subtitle: { fontSize: 13, color: "#475569", marginTop: 4 },

  rowWrap: { display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" },
  mono: { fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace" },

  label: { display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 6 },
  input: {
    width: "100%",
    padding: "12px 14px",
    borderRadius: 12,
    border: "1px solid #e5e7eb",
    outline: "none",
    fontSize: 14,
    background: "#fff",
  },
  textarea: {
    width: "100%",
    padding: "12px 14px",
    borderRadius: 12,
    border: "1px solid #e5e7eb",
    outline: "none",
    fontSize: 14,
    background: "#fff",
  },
  buttons: { display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" },
  btnPrimary: {
    background: "linear-gradient(135deg, #4f46e5, #0ea5e9)",
    color: "#fff",
    border: "none",
    padding: "10px 14px",
    borderRadius: 12,
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
    boxShadow: "0 10px 22px rgba(14,165,233,0.25)",
  },
  btnDisabled: {
    opacity: 0.6,
    cursor: "not-allowed",
  },
  btnGhost: {
    background: "transparent",
    border: "1px solid rgba(255,255,255,0.6)",
    color: "#fff",
    padding: "8px 12px",
    borderRadius: 10,
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
  },
  pill: {
    background: "rgba(255,255,255,0.18)",
    padding: "6px 10px",
    borderRadius: 999,
    fontSize: 12,
    border: "1px solid rgba(255,255,255,0.25)",
  },
  ownerBadge: {
    marginLeft: 10,
    padding: "4px 8px",
    borderRadius: 999,
    background: "rgba(34,197,94,0.12)",
    color: "#16a34a",
    fontSize: 12,
    border: "1px solid rgba(34,197,94,0.25)",
  },
  notOwnerBadge: {
    marginLeft: 10,
    padding: "4px 8px",
    borderRadius: 999,
    background: "rgba(239,68,68,0.1)",
    color: "#dc2626",
    fontSize: 12,
    border: "1px solid rgba(239,68,68,0.25)",
  },
  status: {
    background: "#fff8e1",
    border: "1px solid #f4e5b3",
    color: "#4b5563",
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
  },
  divider: { height: 1, background: "rgba(2,6,23,0.08)", margin: "16px 0" },

  tableWrap: { width: "100%", overflowX: "auto" },
  table: { width: "100%", borderCollapse: "collapse", fontSize: 14 },
  th: { textAlign: "left", borderBottom: "1px solid #e2e8f0", padding: "8px 6px", whiteSpace: "nowrap" },
  td: { borderBottom: "1px solid #f1f5f9", padding: "8px 6px", verticalAlign: "top", wordBreak: "break-word" },

  qrGrid: { display: "flex", flexWrap: "wrap", gap: 12, marginTop: 8 },
  qrItem: { textAlign: "center", padding: 10, border: "1px solid #e5e7eb", borderRadius: 12, background: "#fff" },
};

/* Responsive tweak for two columns on wide screens */
const TwoCol = ({ left, right }) => (
  <div
    style={{
      ...ui.twoCol,
      gridTemplateColumns: window.innerWidth >= 1000 ? "1.2fr 1fr" : "1fr",
    }}
  >
    {left}
    {right}
  </div>
);

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
  const [batchRecipientsText, setBatchRecipientsText] = useState("");
  const [batchUrisText, setBatchUrisText] = useState("");
  const [batchMintedURIs, setBatchMintedURIs] = useState([]);

  // View by tokenId
  const [queryTokenId, setQueryTokenId] = useState("");
  const [queryOwner, setQueryOwner] = useState("");
  const [queryTokenURI, setQueryTokenURI] = useState("");

  // List tokens in range
  const [listFromId, setListFromId] = useState("1");
  const [listToId, setListToId] = useState("25");
  const [listed, setListed] = useState([]);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  /* ------------------------------ UI ------------------------------ */
  return (
    <div style={ui.page}>
      <div style={ui.container}>
        {/* Top Nav */}
        <div style={ui.nav}>
          <div>
            <div style={ui.brand}>VerifychainNFT</div>
            <div style={ui.subbrand}>Soulbound Credentials · Sepolia</div>
          </div>
          <div style={ui.navRight}>
            <div style={ui.pill}>
              Contract: <span style={{ ...ui.mono, marginLeft: 6 }}>{CONTRACT_ADDRESS}</span>
            </div>
            {account ? (
              <button style={ui.btnGhost} onClick={disconnectWallet}>Disconnect</button>
            ) : (
              <button style={ui.btnGhost} onClick={connectWallet}>Connect Wallet</button>
            )}
          </div>
        </div>

        {/* Status */}
        {status && (
          <div style={{ ...ui.status }}>
            {status.includes("http") ? (
              <>
                {status.split(" — View: ")[0]}
                {status.includes(" — View: ") && (
                  <>
                    {" — "}
                    <a
                      href={status.split(" — View: ")[1]}
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: "#1d4ed8", fontWeight: 700, textDecoration: "none" }}
                    >
                      View on Explorer
                    </a>
                  </>
                )}
              </>
            ) : (
              status
            )}
          </div>
        )}

        {/* Wallet & Owner Card */}
        <div style={{ ...ui.card, marginTop: 16 }}>
          <div style={ui.title}>Wallet & Contract</div>
          <div style={ui.divider} />
          <div style={{ ...ui.rowWrap, gap: 14 }}>
            <div style={ui.pill}>
              Network:{" "}
              <strong style={{ marginLeft: 6 }}>
                {chainId
                  ? chainId === 11155111
                    ? "Sepolia"
                    : chainId === 84532
                    ? "Base Sepolia"
                    : `Chain ${chainId}`
                  : "—"}
              </strong>
            </div>
            <div style={ui.pill}>
              {account ? (
                <>
                  Connected: <span style={{ ...ui.mono, marginLeft: 6 }}>{account}</span>
                </>
              ) : (
                "Not connected"
              )}
            </div>
            <div style={ui.pill}>
              Owner:{" "}
              <span style={{ ...ui.mono, marginLeft: 6 }}>
                {owner ? owner : account ? "Loading…" : "Connect to load"}
              </span>
              {owner && account && (
                <span style={isOwner ? ui.ownerBadge : ui.notOwnerBadge}>
                  {isOwner ? "You are the owner" : "Not owner"}
                </span>
              )}
            </div>
            <a
              href={`${
                explorerBase || "https://etherscan.io"
              }/address/${CONTRACT_ADDRESS}`}
              target="_blank"
              rel="noreferrer"
              style={{ ...ui.pill, textDecoration: "none", color: "inherit" }}
            >
              Open in Explorer ↗
            </a>
          </div>
        </div>

        {/* Main Grid */}
        <div style={ui.grid}>
          <TwoCol
            /* LEFT: Admin Actions */
            left={
              <div style={ui.card}>
                <div style={ui.title}>Admin Actions</div>
                <div style={ui.subtitle}>
                  Issue credentials as the contract owner. Batch issuing supports comma/newline separated lists.
                </div>
                <div style={ui.divider} />

                {!account && (
                  <div style={{ color: "#b91c1c", fontWeight: 600 }}>
                    Connect your wallet to continue.
                  </div>
                )}
                {account && !isOwner && (
                  <div style={{ color: "#b91c1c", fontWeight: 600 }}>
                    Your wallet is not the contract owner. Issuance is disabled.
                  </div>
                )}

                {/* Single Issue */}
                <div style={{ marginTop: 10 }}>
                  <div style={{ fontWeight: 700, marginBottom: 8 }}>Issue Single Credential</div>
                  <label style={ui.label}>Recipient Address</label>
                  <input
                    style={ui.input}
                    placeholder="0xRecipient..."
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                  />

                  <div style={{ height: 8 }} />
                  <label style={ui.label}>Token URI</label>
                  <input
                    style={ui.input}
                    placeholder="ipfs://... or data:application/json;base64,..."
                    value={tokenURI}
                    onChange={(e) => setTokenURI(e.target.value)}
                  />

                  <div style={{ ...ui.buttons, marginTop: 12 }}>
                    <button
                      onClick={issueCredential}
                      disabled={!account || !isOwner}
                      style={{
                        ...ui.btnPrimary,
                        ...( !account || !isOwner ? ui.btnDisabled : {} ),
                      }}
                    >
                      Issue Credential
                    </button>
                  </div>
                </div>

                {/* Divider */}
                <div style={ui.divider} />

                {/* Batch Issue */}
                <div>
                  <div style={{ fontWeight: 700, marginBottom: 8 }}>Batch Issue Credentials</div>
                  <label style={ui.label}>Recipients (comma or newline separated)</label>
                  <textarea
                    rows={4}
                    style={ui.textarea}
                    placeholder={"0xabc...\n0xdef...\n0x123..."}
                    value={batchRecipientsText}
                    onChange={(e) => setBatchRecipientsText(e.target.value)}
                  />
                  <div style={{ height: 8 }} />
                  <label style={ui.label}>
                    Token URIs (comma or newline separated; must match recipients count)
                  </label>
                  <textarea
                    rows={4}
                    style={ui.textarea}
                    placeholder={"ipfs://...\nipfs://...\nipfs://..."}
                    value={batchUrisText}
                    onChange={(e) => setBatchUrisText(e.target.value)}
                  />
                  <div style={{ ...ui.buttons, marginTop: 12 }}>
                    <button
                      onClick={issueBatch}
                      disabled={!account || !isOwner}
                      style={{
                        ...ui.btnPrimary,
                        ...( !account || !isOwner ? ui.btnDisabled : {} ),
                      }}
                    >
                      Batch Issue
                    </button>
                  </div>

                  {/* Batch QR Codes */}
                  {batchMintedURIs.length > 0 && (
                    <div style={{ marginTop: 14 }}>
                      <div style={{ fontWeight: 700, marginBottom: 6 }}>QR Codes (Batch)</div>
                      <div style={ui.qrGrid}>
                        {batchMintedURIs.map((uri, idx) => (
                          <div key={idx} style={ui.qrItem}>
                            <QRCode value={uri} size={120} />
                            <div style={{ marginTop: 6, fontSize: 12, maxWidth: 220, wordBreak: "break-all" }}>
                              {uri}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            }

            /* RIGHT: Verify + Tools */
            right={
              <div style={ui.card}>
                <div style={ui.title}>Verify & Explore</div>
                <div style={ui.subtitle}>
                  Look up ownership and metadata, or list a range of token IDs.
                </div>
                <div style={ui.divider} />

                {/* Lookup by Token ID */}
                <div>
                  <div style={{ fontWeight: 700, marginBottom: 8 }}>Lookup by Token ID</div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <input
                      style={{ ...ui.input, flex: "1 1 180px" }}
                      placeholder="Token ID"
                      value={queryTokenId}
                      onChange={(e) => setQueryTokenId(e.target.value)}
                    />
                    <button style={ui.btnPrimary} onClick={lookupToken}>
                      Lookup
                    </button>
                  </div>
                  <div style={{ marginTop: 10 }}>
                    <div>
                      <span style={ui.label}>Owner</span>
                      <div style={{ ...ui.mono, fontSize: 13 }}>
                        {queryOwner || "—"}
                      </div>
                    </div>
                    <div style={{ marginTop: 6 }}>
                      <span style={ui.label}>Token URI</span>
                      <div style={{ fontSize: 13, wordBreak: "break-all" }}>
                        {queryTokenURI || "—"}
                      </div>
                    </div>

                    {queryTokenURI && (
                      <div style={{ marginTop: 12 }}>
                        <div style={{ fontWeight: 700, marginBottom: 6 }}>QR Code</div>
                        <div style={{ display: "inline-block", padding: 10, borderRadius: 12, border: "1px solid #e5e7eb", background: "#fff" }}>
                          <QRCode value={queryTokenURI} size={140} />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div style={ui.divider} />

                {/* List Tokens in Range */}
                <div>
                  <div style={{ fontWeight: 700, marginBottom: 8 }}>List Tokens in Range</div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <input
                      style={{ ...ui.input, width: 120 }}
                      placeholder="From ID"
                      value={listFromId}
                      onChange={(e) => setListFromId(e.target.value)}
                    />
                    <input
                      style={{ ...ui.input, width: 120 }}
                      placeholder="To ID"
                      value={listToId}
                      onChange={(e) => setListToId(e.target.value)}
                    />
                    <button style={ui.btnPrimary} onClick={listRange}>
                      List
                    </button>
                  </div>

                  <div style={{ marginTop: 12 }}>
                    {listed.length === 0 ? (
                      <div style={{ color: "#6b7280" }}>—</div>
                    ) : (
                      <div style={ui.tableWrap}>
                        <table style={ui.table}>
                          <thead>
                            <tr>
                              <th style={ui.th}>Token ID</th>
                              <th style={ui.th}>Owner</th>
                              <th style={ui.th}>Token URI</th>
                            </tr>
                          </thead>
                          <tbody>
                            {listed.map((row) => (
                              <tr key={row.tokenId}>
                                <td style={ui.td}>{row.tokenId}</td>
                                <td style={{ ...ui.td, ...ui.mono }}>{row.owner}</td>
                                <td style={ui.td}>{row.uri}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                  <div style={{ marginTop: 8, fontSize: 12, color: "#64748b" }}>
                    Tip: your contract doesn’t expose a total supply; this queries a range you choose (e.g., 1–25).
                  </div>
                </div>
              </div>
            }
          />
        </div>
      </div>
    </div>
  );
}
