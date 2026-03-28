#!/bin/bash
set -e

echo "=== DARKPOOL DEMO ==="
echo ""

if [ -z "$SEPOLIA_RPC_URL" ]; then
  echo "ERROR: Set SEPOLIA_RPC_URL in .env first"
  exit 1
fi

echo "[1/4] Starting relay nodes..."
docker compose up -d node1 node2 node3
sleep 3

echo "[2/4] Starting attacker bot..."
docker compose up -d attacker-bot
sleep 2

echo "[3/4] Starting dashboard..."
docker compose up -d dashboard
sleep 2

echo "[4/4] All services running!"
echo ""
echo "  Relay Node 1 (Pi):  http://localhost:8545"
echo "  Relay Node 2:       http://localhost:8546"
echo "  Relay Node 3:       http://localhost:8547"
echo "  Attacker Bot:       http://localhost:9000"
echo "  Dashboard:          http://localhost:3000"
echo ""
echo "Point MetaMask Custom RPC to http://localhost:8545 for protected transactions"
echo "Use default Sepolia RPC for unprotected transactions (for comparison)"
echo ""
echo "To stop: docker compose down"
