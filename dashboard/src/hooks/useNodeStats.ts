import { useState, useEffect } from "react";

interface NodeStatus {
  nodeId: string;
  network: string;
  totalRelayed: number;
  totalMevSaved: string;
  pendingBatch: number;
  uptime: number;
}

interface RelayEvent {
  type: "received" | "encrypted" | "batched" | "relayed" | "confirmed";
  txHash?: string;
  timestamp: number;
  mevEstimate?: {
    estimatedSavings: string;
    attackType: string;
  };
}

export function useNodeStatus(nodeUrl: string) {
  const [status, setStatus] = useState<NodeStatus | null>(null);

  useEffect(() => {
    async function fetch() {
      try {
        const res = await globalThis.fetch(`${nodeUrl}/status`);
        setStatus(await res.json());
      } catch {}
    }
    fetch();
    const interval = setInterval(fetch, 5000);
    return () => clearInterval(interval);
  }, [nodeUrl]);

  return status;
}

export function useRelayEvents(nodeUrl: string) {
  const [events, setEvents] = useState<RelayEvent[]>([]);

  useEffect(() => {
    const es = new EventSource(`${nodeUrl}/events/stream`);
    es.onmessage = (e) => {
      const event = JSON.parse(e.data) as RelayEvent;
      setEvents((prev) => [...prev.slice(-49), event]);
    };
    return () => es.close();
  }, [nodeUrl]);

  return events;
}

export function useAttackerStatus(attackerUrl: string) {
  const [status, setStatus] = useState<any>(null);

  useEffect(() => {
    async function fetch() {
      try {
        const res = await globalThis.fetch(`${attackerUrl}/status`);
        setStatus(await res.json());
      } catch {}
    }
    fetch();
    const interval = setInterval(fetch, 5000);
    return () => clearInterval(interval);
  }, [attackerUrl]);

  return status;
}
