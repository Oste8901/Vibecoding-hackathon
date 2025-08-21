// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title VeryfychainNFT
 * @dev Soulbound ERC721 token for credentials. Only owner can issue.
 */
contract VeryfychainNFT is ERC721, Ownable {
    using Counters for Counters.Counter;

    Counters.Counter private _tokenIds;
    mapping(uint256 => string) private _tokenURIs;

    constructor(string memory name, string memory symbol) ERC721(name, symbol) {}

    /// @dev Issue a new credential (mint soulbound NFT)
 /// @dev Issue a new credential (mint soulbound NFT)
function issueCredential(address to, string memory _tokenURI) public onlyOwner returns (uint256) {
    _tokenIds.increment();
    uint256 newTokenId = _tokenIds.current();
    _mint(to, newTokenId);
    _tokenURIs[newTokenId] = _tokenURI;
    return newTokenId;
}


    /// @dev Batch mint credentials
  function issueBatchCredentials(address[] memory recipients, string[] memory uris) public onlyOwner returns (uint256[] memory) {
    require(recipients.length == uris.length, "Arrays must match in length");
    uint256[] memory tokenIds = new uint256[](recipients.length);

    for (uint256 i = 0; i < recipients.length; i++) {
        _tokenIds.increment();
        uint256 newTokenId = _tokenIds.current();
        _mint(recipients[i], newTokenId);
        _tokenURIs[newTokenId] = uris[i];
        tokenIds[i] = newTokenId;
    }

    return tokenIds;
}

 function issueSequentialCredentials(address[] memory recipients, string[] memory uris) 
        public 
        onlyOwner 
        returns (uint256[] memory) 
    {
        require(recipients.length == uris.length, "Arrays must match in length");
        uint256[] memory tokenIds = new uint256[](recipients.length);

        for (uint256 i = 0; i < recipients.length; i++) {
            // Reuse internal mint logic
            uint256 newTokenId = _mintCredential(recipients[i], uris[i]);
            tokenIds[i] = newTokenId;
        }

        return tokenIds;
    }

    /// @dev Internal mint logic for batch minting
    function _mintCredential(address to, string memory uri) internal returns (uint256) {
        _tokenIds.increment();
        uint256 newTokenId = _tokenIds.current();
        _mint(to, newTokenId);
        _tokenURIs[newTokenId] = uri;
        return newTokenId;
    }

    /// @dev Prevent transfers (Soulbound)
    function approve(address, uint256) public pure override {
        revert("Soulbound: non-transferable");
    }

    function setApprovalForAll(address, bool) public pure override {
        revert("Soulbound: non-transferable");
    }

    function transferFrom(address, address, uint256) public pure override {
        revert("Soulbound: non-transferable");
    }

    function safeTransferFrom(address, address, uint256) public pure override {
        revert("Soulbound: non-transferable");
    }

    function safeTransferFrom(address, address, uint256, bytes memory) public pure override {
        revert("Soulbound: non-transferable");
    }

    /// @dev Return token URI
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_exists(tokenId), "Nonexistent token");
        return _tokenURIs[tokenId];
    }
}

