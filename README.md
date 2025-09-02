AdwaMint: Soulbound Credential Platform
AdwaMint is a decentralized application (dApp) for issuing and managing verifiable, non-transferable digital credentials on the blockchain. It uses a "soulbound" ERC721 NFT standard, where each token represents 
a unique credential—like a diploma or certificate—that is permanently bound to a recipient's wallet address.
The platform allows anyone to verify the authenticity of a credential directly on-chain, removing the need to contact the issuing institution.
________________________________________
Key Features 📜

•	Soulbound Tokens: Credentials cannot be transferred, sold, or delegated, ensuring only the original recipient maintains ownership.

•	On-Chain Verification: The blockchain serves as an immutable public ledger for all issued credentials.

•	Owner-Controlled Issuance: Only the designated contract owner can mint new credentials, preventing unauthorized issuance6.

•	Efficient Batch Minting: The contract supports issuing multiple credentials in a single transaction to save on gas costs.

•	Decentralized Metadata: Credential details are stored off-chain (e.g., on IPFS), with only a URI reference saved on-chain to protect privacy.

________________________________________
System Components

AdwaMint consists of three main components working together:

1.	Smart Contract (VeryfychainNFT.sol): The core Solidity contract that defines the logic for the soulbound NFT, including issuance and non-transferability rules.

2.	Frontend Application (index.js): A Nextjs web interface for the contract owner to issue credentials and for the public to verify them.

3.	Blockchain Interaction (contract.js): JavaScript helpers using Ethers.js to connect the frontend to the deployed smart contract.

________________________________________
Smart Contract Architecture (VeryfychainNFT.sol)

The VeryfychainNFT contract is the system's backbone, inheriting from OpenZeppelin's ERC721 and Ownable contracts.

The Soulbound Mechanism 

Non-transferability is enforced by overriding all standard ERC721 transfer functions (approve, transferFrom, safeTransferFrom, etc.) to make them revert with an error message, effectively binding the NFT to the recipient's wallet forever.

Core Functions

Write Functions (Owner Only)

•	issueCredential(address to, string memory _tokenURI): Mints a single soulbound credential to a recipient.

•	issueBatchCredentials(address[] memory recipients, string[] memory uris): Mints multiple credentials in a single, gas-efficient transaction.

View Functions (Public)

•	tokenURI(uint256 tokenId): A standard view function to retrieve the metadata URI for a given credential.

________________________________________
Deployment & Setup

Prerequisites

•	Foundry: For smart contract compilation and deployment.

•	.env File: A .env file in the project root containing PRIVATE_KEY and SEPOLIA_RPC_URL.

Deployment Steps

1.	Navigate to the project's root directory.

2.	Run the Foundry deployment script:

Bash
forge script script/Deploy.s.sol:DeployScript --rpc-url $SEPOLIA_RPC_URL --broadcast --verify -vvvv

3.	Note the deployed contract address printed in the console.

Frontend Configuration

1.	Open lib/contract.js.

2.	Update CONTRACT_ADDRESS with your deployed contract address.

3.	In the getReadOnlyContract function, replace the "Alchemy_SEPOLIA_RPC_URL" placeholder with your actual Sepolia RPC URL.
________________________________________
Security and Best Practices
•	Private Key Management: The deployer's private key has ultimate control and must be kept secure. For production, consider using a Gnosis Safe (multisig) or a hardware wallet.
•	Data Privacy: Do not store any personally identifiable information (PII) on the blockchain. Use the metadata URI to point to an off-chain resource.
•	Revocation: This implementation does not include a mechanism to revoke credentials. For use cases requiring revocation, a burn function or a revocation registry would need to be added.
