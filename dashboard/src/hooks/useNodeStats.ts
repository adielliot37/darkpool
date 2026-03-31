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
    async function loadHistory() {
      try {
        const res = await globalThis.fetch(`${nodeUrl}/events`);
        const history = await res.json();
        if (Array.isArray(history) && history.length > 0) {
          setEvents(history.slice(-50));
        }
      } catch {}
    }
    loadHistory();

    const es = new EventSource(`${nodeUrl}/events/stream`);
    es.onmessage = (e) => {
      const event = JSON.parse(e.data) as RelayEvent;
      setEvents((prev) => [...prev.slice(-49), event]);
    };
    es.onerror = () => {
      setTimeout(loadHistory, 5000);
    };

    const interval = setInterval(loadHistory, 10000);
    return () => { es.close(); clearInterval(interval); };
  }, [nodeUrl]);

  return events;
}

export function useAttackerStatus(attackerUrl: string) {
  const [status, setStatus] = useState<any>(null);

  useEffect(() => {
    if (!attackerUrl) return;
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
