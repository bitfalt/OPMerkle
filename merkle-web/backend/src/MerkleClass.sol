// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

contract MerkleClass {
    bytes32 public immutable merkleRoot;
    uint256 public immutable amount;

    event Claimed(address account, uint256 amount);

    constructor(bytes32 _merkleRoot, uint256 _amount) {
        merkleRoot = _merkleRoot;
        amount = _amount;
    }

    function claim(address _account, bytes32[] calldata _merkleProof) public {
        // Verify merkle proof
        bytes32 node = keccak256(abi.encodePacked(_account, amount));

        require(
            MerkleProof.verify(_merkleProof, merkleRoot, node), 
            "MerkleClass: Invalid proof."
        );

        emit Claimed(_account, amount);
    }

}
