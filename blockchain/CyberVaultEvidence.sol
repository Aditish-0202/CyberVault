// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract CyberVaultEvidence {
    struct Evidence {
        bytes32 digest;
        uint256 timestamp;
    }

    address public immutable writer;
    mapping(uint256 => Evidence) public evidence;

    event EvidenceAnchored(uint256 indexed eventId, bytes32 digest, uint256 timestamp);

    constructor() {
        writer = msg.sender;
    }

    function anchor(uint256 eventId, bytes32 digest) external {
        require(msg.sender == writer, "Unauthorized writer");
        require(eventId != 0 && digest != bytes32(0), "Invalid evidence");
        require(evidence[eventId].digest == bytes32(0), "Evidence already anchored");

        evidence[eventId] = Evidence(digest, block.timestamp);
        emit EvidenceAnchored(eventId, digest, block.timestamp);
    }
}
