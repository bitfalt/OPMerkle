// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

contract MerkleClass {
    bytes32 public immutable merkleRoot;
    uint256 public immutable amount;

    event Claimed(address account, uint256 amount);
    event Received(address sender, uint256 amount);

    constructor(bytes32 _merkleRoot, uint256 _amount) {
        merkleRoot = _merkleRoot;
        amount = _amount;
    }

    function deposit() public payable {
        emit Received(msg.sender, msg.value);
    }

    function claim(address _account, bytes32[] memory _merkleProof) public {
        // Verify merkle proof
        bytes32 leaf = keccak256(bytes.concat(keccak256(abi.encode(_account, amount))));

        require(
            MerkleProof.verify(_merkleProof, merkleRoot, leaf), 
            "MerkleClass: Invalid proof."
        );

        _withdraw(payable(_account));

        emit Claimed(_account, amount);
    }

    function _withdraw(address payable _account) internal {
        require(
            address(this).balance >= amount, 
            "MerkleClass: Insufficient balance."
        );

        _account.transfer(amount);
    }
}
