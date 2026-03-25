// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract AgentIdentity8004 is ERC721 {
    struct AgentMetadata {
        string name;
        string agentType;
        string endpoint;
        uint256 createdAt;
        mapping(string => string) attributes;
    }

    uint256 private _nextTokenId;
    mapping(uint256 => AgentMetadata) private _metadata;
    mapping(address => uint256) public agentTokenId;
    string[] private _attributeKeys;

    event AgentRegistered(uint256 indexed tokenId, address indexed owner, string name);
    event AttributeUpdated(uint256 indexed tokenId, string key, string value);

    constructor() ERC721("Darkpool Agent Identity", "DPAI") {}

    function registerAgent(string calldata name, string calldata agentType, string calldata endpoint) external returns (uint256) {
        require(agentTokenId[msg.sender] == 0 || !_exists(agentTokenId[msg.sender]), "Already registered");
        uint256 tokenId = ++_nextTokenId;
        _mint(msg.sender, tokenId);
        AgentMetadata storage meta = _metadata[tokenId];
        meta.name = name;
        meta.agentType = agentType;
        meta.endpoint = endpoint;
        meta.createdAt = block.timestamp;
        agentTokenId[msg.sender] = tokenId;
        emit AgentRegistered(tokenId, msg.sender, name);
        return tokenId;
    }

    function setAttribute(uint256 tokenId, string calldata key, string calldata value) external {
        require(ownerOf(tokenId) == msg.sender, "Not owner");
        _metadata[tokenId].attributes[key] = value;
        emit AttributeUpdated(tokenId, key, value);
    }

    function getAttribute(uint256 tokenId, string calldata key) external view returns (string memory) {
        return _metadata[tokenId].attributes[key];
    }

    function getAgent(uint256 tokenId) external view returns (string memory name, string memory agentType, string memory endpoint, uint256 createdAt) {
        AgentMetadata storage meta = _metadata[tokenId];
        return (meta.name, meta.agentType, meta.endpoint, meta.createdAt);
    }

    function _exists(uint256 tokenId) internal view returns (bool) {
        return _ownerOf(tokenId) != address(0);
    }
}
