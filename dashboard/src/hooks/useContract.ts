import { useState, useEffect } from "react";
import { ethers } from "ethers";

const REGISTRY_ABI = [
  "function getNetworkStats() view returns (uint256 activeNodeCount, uint256 relays, uint256 mevSaved)",
  "function getActiveNodes() view returns (address[])",
  "function nodes(address) view returns (address owner, string endpoint, bytes publicKey, uint256 totalRelays, uint256 totalMevSaved, uint256 registeredAt, uint256 lastActiveAt, bool active)",
  "function getNodeReputation(address) view returns (uint256 totalRelays, uint256 totalMevSaved, uint256 uptime, bool active)",
];

const RPC = import.meta.env.VITE_RPC_URL || "https://mainnet.base.org";
const REGISTRY = import.meta.env.VITE_REGISTRY_ADDRESS || "";

interface NetworkStats {
  activeNodes: number;
  totalRelays: number;
  totalMevSaved: string;
}

interface NodeInfo {
  address: string;
  endpoint: string;
  totalRelays: number;
  totalMevSaved: string;
  lastActiveAt: number;
  active: boolean;
}

export function useNetworkStats() {
  const [stats, setStats] = useState<NetworkStats>({ activeNodes: 0, totalRelays: 0, totalMevSaved: "0" });
  const [nodes, setNodes] = useState<NodeInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!REGISTRY) {
      setLoading(false);
      return;
    }

    const provider = new ethers.JsonRpcProvider(RPC);
    const contract = new ethers.Contract(REGISTRY, REGISTRY_ABI, provider);

    async function fetch() {
      try {
        const [activeNodeCount, relays, mevSaved] = await contract.getNetworkStats();
        setStats({
          activeNodes: Number(activeNodeCount),
          totalRelays: Number(relays),
          totalMevSaved: ethers.formatEther(mevSaved),
        });

        const addresses: string[] = await contract.getActiveNodes();
        const nodeInfos: NodeInfo[] = [];
        for (const addr of addresses) {
          const node = await contract.nodes(addr);
          nodeInfos.push({
            address: addr,
            endpoint: node.endpoint,
            totalRelays: Number(node.totalRelays),
            totalMevSaved: ethers.formatEther(node.totalMevSaved),
            lastActiveAt: Number(node.lastActiveAt),
            active: node.active,
          });
        }
        setNodes(nodeInfos);
      } catch {
        // Free RPC rate limit, silently retry later
      }
      setLoading(false);
    }

    fetch();
    const interval = setInterval(fetch, 30000);
    return () => clearInterval(interval);
  }, []);

  return { stats, nodes, loading };
}
