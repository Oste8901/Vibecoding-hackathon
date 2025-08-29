// script/Deploy.s.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Script} from "forge-std/Script.sol";
import{VeryfychainNFT} from "src/Verifychain.sol";

contract DeployScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        vm.startBroadcast(deployerPrivateKey);

        VeryfychainNFT nft = new VeryfychainNFT(
            "VerifyChain Credentials", 
            "VCC"
        );

        vm.stopBroadcast();
    }
}
