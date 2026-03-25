// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract DarkpoolRegistry {
    struct Node {
        address owner;
        string endpoint;
        bytes publicKey;
        uint256 totalRelays;
        uint256 totalMevSaved;
        uint256 registeredAt;
        uint256 lastActiveAt;
        bool active;
    }

    struct RelayRecord {
        bytes32 bundleHash;
        uint256 mevSaved;
        string storachaCid;
        uint256 timestamp;
    }

    mapping(address => Node) public nodes;
    mapping(address => RelayRecord[]) public relayHistory;
    address[] public nodeList;

    uint256 public totalNetworkRelays;
    uint256 public totalNetworkMevSaved;

    event NodeRegistered(address indexed nodeId, string endpoint);
    event RelayRecorded(address indexed nodeId, bytes32 bundleHash, uint256 mevSaved);
    event NodeDeactivated(address indexed nodeId);

    function registerNode(string calldata endpoint, bytes calldata publicKey) external {
        require(!nodes[msg.sender].active, "Already registered");
        nodes[msg.sender] = Node({
            owner: msg.sender,
            endpoint: endpoint,
            publicKey: publicKey,
            totalRelays: 0,
            totalMevSaved: 0,
            registeredAt: block.timestamp,
            lastActiveAt: block.timestamp,
            active: true
        });
        nodeList.push(msg.sender);
        emit NodeRegistered(msg.sender, endpoint);
    }

    function deactivateNode() external {
        require(nodes[msg.sender].active, "Not active");
        nodes[msg.sender].active = false;
        emit NodeDeactivated(msg.sender);
    }

    function recordRelay(bytes32 bundleHash, uint256 mevSaved, string calldata storachaCid) external {
        require(nodes[msg.sender].active, "Not registered");
        relayHistory[msg.sender].push(RelayRecord({
            bundleHash: bundleHash,
            mevSaved: mevSaved,
            storachaCid: storachaCid,
            timestamp: block.timestamp
        }));
        nodes[msg.sender].totalRelays++;
        nodes[msg.sender].totalMevSaved += mevSaved;
        nodes[msg.sender].lastActiveAt = block.timestamp;
        totalNetworkRelays++;
        totalNetworkMevSaved += mevSaved;
        emit RelayRecorded(msg.sender, bundleHash, mevSaved);
    }

    function getNodeReputation(address nodeId) external view returns (uint256 totalRelays, uint256 totalMevSaved, uint256 uptime, bool active) {
        Node memory node = nodes[nodeId];
        return (node.totalRelays, node.totalMevSaved, block.timestamp - node.registeredAt, node.active);
    }

    function getActiveNodes() external view returns (address[] memory) {
        uint256 count = 0;
        for (uint256 i = 0; i < nodeList.length; i++) {
            if (nodes[nodeList[i]].active) count++;
        }
        address[] memory active = new address[](count);
        uint256 idx = 0;
        for (uint256 i = 0; i < nodeList.length; i++) {
            if (nodes[nodeList[i]].active) {
                active[idx++] = nodeList[i];
            }
        }
        return active;
    }

    function getNetworkStats() external view returns (uint256 activeNodeCount, uint256 relays, uint256 mevSaved) {
        uint256 count = 0;
        for (uint256 i = 0; i < nodeList.length; i++) {
            if (nodes[nodeList[i]].active) count++;
        }
        return (count, totalNetworkRelays, totalNetworkMevSaved);
    }

    function getRelayCount(address nodeId) external view returns (uint256) {
        return relayHistory[nodeId].length;
    }

    function getRelay(address nodeId, uint256 index) external view returns (bytes32, uint256, string memory, uint256) {
        RelayRecord memory r = relayHistory[nodeId][index];
        return (r.bundleHash, r.mevSaved, r.storachaCid, r.timestamp);
    }
}
