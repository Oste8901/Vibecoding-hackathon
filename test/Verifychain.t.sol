// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Test} from "forge-std/Test.sol";
import {VeryfychainNFT} from "src/Verifychain.sol"; // Adjust path if needed
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

contract VerfychainNFTTest is Test {
    VeryfychainNFT vc;
    address owner;
    address user1;
    address user2;

    function setUp() public {
        owner = address(this);
        user1 = address(0x1);
        user2 = address(0x2);
        
        // Deploy contract
        vc = new VeryfychainNFT("VeryfychainNFT", "VCNFT");
    }

    function testMintAndTokenURI() public {
        uint256 tokenId = vc.issueCredential(user1, "https://example.com/credential/1");
        assertEq(vc.ownerOf(tokenId), user1);
        assertEq(vc.tokenURI(tokenId), "https://example.com/credential/1");
    }

    function testNonTransferable() public {
        uint256 tokenId = vc.issueCredential(user1, "https://example.com/credential/2");
        vm.expectRevert(bytes("Soulbound: non-transferable"));
        vc.approve(user2, tokenId);
        vm.expectRevert(bytes("Soulbound: non-transferable"));
        vc.setApprovalForAll(user2, true);
        vm.expectRevert(bytes("Soulbound: non-transferable"));
        vc.transferFrom(user1, user2, tokenId);
        vm.expectRevert(bytes("Soulbound: non-transferable"));
        vc.safeTransferFrom(user1, user2, tokenId);
        vm.expectRevert(bytes("Soulbound: non-transferable"));
        vc.safeTransferFrom(user1, user2, tokenId, "");
    }

    function testOnlyOwnerCanMint() public {
        vm.prank(user1);
        vm.expectRevert();
        vc.issueCredential(user2, "https://example.com/credential/3");
    }

    function testSupportsInterface() public {
        bytes4 ERC721_ID = type(IERC721).interfaceId;
        assertTrue(vc.supportsInterface(ERC721_ID));
    }

    function testSupportsInterfaceInvalid() public {
        bool result = vc.supportsInterface(0x12345678);
        assertFalse(result);
    }

    function testTokenURINonexistentToken() public {
        vm.expectRevert(bytes("Nonexistent token"));
        vc.tokenURI(999);
    }
function testBatchMintingSequentialStyle() public {
    // Create arrays inline
  
}


function testSequentialMintingTwo() public {
    uint256 id1 = vc.issueCredential(owner, "https://example.com/credential/batch1");
    uint256 id2 = vc.issueCredential(user1, "https://example.com/credential/batch2");

    assertEq(vc.ownerOf(id1), owner);
    assertEq(vc.ownerOf(id2), user1);

    assertEq(vc.tokenURI(id1), "https://example.com/credential/batch1");
    assertEq(vc.tokenURI(id2), "https://example.com/credential/batch2");
}



   



    
}
