# Darkpool

A decentralized relay network that protects DeFi transactions from MEV extraction. Transactions are encrypted, batched, and privately submitted to block builders so sandwich bots never see them.

Runs on a Raspberry Pi 4 in your house. No cloud. No centralized relay. No trust required.

**Live endpoint:** https://mev.elliot37.com
**Chain:** Base (8453)
**Agent ID:** #37507 on ERC-8004 Identity Registry

## How it works

```
Normal flow:  Wallet -> Public Mempool -> MEV Bot sees it -> Sandwich Attack -> You lose money
Darkpool:     Wallet -> Pi Node -> Lit Encrypt (TEE) -> Private Submit -> Chain (bots see nothing)
```

1. Point your wallet RPC to `https://mev.elliot37.com`
2. The Pi node receives your raw transaction
3. Encrypts it via Lit Protocol Chipotle V3 (runs inside a TEE)
4. Submits it directly to Base, bypassing the public mempool
5. Logs a signed receipt to Storacha (IPFS/Filecoin)
6. Posts reputation feedback to ERC-8004 Reputation Registry

## Architecture

```
node/                    Relay node (TypeScript, Express)
  src/
    rpc-server.ts        JSON-RPC server, intercepts eth_sendRawTransaction
    tx-encryptor.ts      Lit Protocol Chipotle V3 encryption (TEE)
    tx-batcher.ts        Batching with timing randomization
    private-relay.ts     Submits to Base privately
    mev-estimator.ts     Estimates MEV savings per transaction
    receipt-logger.ts    Signs receipts, uploads to Storacha
    lit-chipotle.ts      Lit V3 REST API: encrypt, decrypt, PKP sign, verify
    node-identity.ts     ERC-8004 identity + reputation registry
    agent-loop.ts        Autonomous plan/execute/verify cycle
    key-manager.ts       Persistent node wallet key
    starknet-relay.ts    Starknet RPC proxy for multi-chain support

contracts/               Solidity (Hardhat)
  DarkpoolRegistry.sol   Node registry, relay stats, MEV saved
  AgentIdentity8004.sol  ERC-721 agent identity

dashboard/               React + Vite
  NetworkStatus          Active nodes, total relays, MEV saved
  LiveFeed               Real-time tx flow with Basescan links + IPFS receipts
  SideBySideDemo         Public mempool vs Darkpool comparison
  NodeCard               Per-node stats with hardware badge
  MevSavings             Protected vs extracted comparison

attacker-bot/            MEV sandwich bot simulator (for demo)
```

## On-chain contracts (Base mainnet, verified)

| Contract | Address |
|----------|---------|
| DarkpoolRegistry | [`0xCa46735BF5c66575C8ac1E6302b539C4eBEa28F7`](https://basescan.org/address/0xCa46735BF5c66575C8ac1E6302b539C4eBEa28F7#code) |
| AgentIdentity8004 | [`0x91786D8747434cAF52631c272Ecb5E1C9803A82c`](https://basescan.org/address/0x91786D8747434cAF52631c272Ecb5E1C9803A82c#code) |
| ERC-8004 Identity Registry | [`0x8004A169FB4a3325136EB29fA0ceB6D2e539a432`](https://basescan.org/address/0x8004A169FB4a3325136EB29fA0ceB6D2e539a432#readContract) |
| ERC-8004 Reputation Registry | [`0x8004BAa17C55a88189AE136b182e5fdA19dE9b63`](https://basescan.org/address/0x8004BAa17C55a88189AE136b182e5fdA19dE9b63#readContract) |

## Sponsor integrations

**Lit Protocol (Chipotle V3)** - Transaction encryption inside TEE via REST API. PKP wallet signing for receipts. Lit Actions for relay verification. No SDK dependency, pure HTTP calls.
- PKP wallet: `0x7360dcA8a9a0333EeBBfB0bbf7386EB7D7d6D362`
- Dashboard: https://dashboard.dev.litprotocol.com

**Storacha** - Every relay produces a signed receipt uploaded to IPFS/Filecoin. Publicly resolvable.
- Example receipt: [bafkreichpebs44fxhihxfc4rak6tnuadoza6au3en23z33g7yz3yysmelq](https://bafkreichpebs44fxhihxfc4rak6tnuadoza6au3en23z33g7yz3yysmelq.ipfs.w3s.link)
- Space: `did:key:z6MkpmJoQjFUX3CZd7TbbKho8bt2R6rBE7dMdU4w8XTNetaE`

**ERC-8004 (Ethereum Foundation)** - Agent #37507 registered on the real Identity Registry. 3 reputation feedbacks from 2 clients on the Reputation Registry. agent.json and agent_log.json in repo root.
- Registration tx: [`0x15d778...`](https://basescan.org/tx/0x15d7788138ed7af24fc1df86e9b9db2f905612f8463115937ee761e77998af01)
- Reputation tx: [`0xd36481...`](https://basescan.org/tx/0xd364814042022807baf838467398250c4ed2f838f707ad09831c5b9b8d841c7a)

**Protocol Labs** - Raspberry Pi 4 running the relay node. Physical hardware, no cloud dependency. Cloudflare tunnel exposes it at mev.elliot37.com. Survives power cuts (ext4 journaling), auto-starts on boot (systemd).

## Verified transactions

| What | Tx |
|------|----|
| Agent registration (ERC-8004) | [`0x15d778...`](https://basescan.org/tx/0x15d7788138ed7af24fc1df86e9b9db2f905612f8463115937ee761e77998af01) |
| Node registration (DarkpoolRegistry) | [`0x1c5235...`](https://basescan.org/tx/0x1c5235d59975b3dd2d7400ca0071aec27f51a0f47b0b1abf30a431f58ad9fb7e) |
| Reputation feedback x3 | [`0xd36481...`](https://basescan.org/tx/0xd364814042022807baf838467398250c4ed2f838f707ad09831c5b9b8d841c7a) [`0x9c0f4e...`](https://basescan.org/tx/0x9c0f4e7c64209e6cf9649bfbea9247ddb7a8d442d089bf32b2fdedb2e68f22c6) [`0xed3faf...`](https://basescan.org/tx/0xed3fafee586145c170445edf70d605c90939861a5ea254127b3a88877b181242) |
| Relayed swap (ETH to USDC) | [`0x781d72...`](https://basescan.org/tx/0x781d721d8f4a70e06b02f13876597ab6408e550a8dd4c47c17093348bbd7a4ea) |
| Relayed transfer | [`0x251196...`](https://basescan.org/tx/0x251196b749efb1f5502ed52f2e739d631991b4c506c87d49c86702508d5adbf9) |

## Setup

### Use as a user (protect your txs)

Add to MetaMask:
```
Network: Base
RPC URL: https://mev.elliot37.com
Chain ID: 8453
Currency: ETH
Explorer: https://basescan.org
```

### Run your own node

```bash
git clone https://github.com/adielliot37/darkpool.git
cd darkpool/node
cp ../.env.example ../.env   # fill in your keys
npm install
npm run build
npm start
```

Required env vars:
```
NETWORK=base
BASE_RPC_URL=https://mainnet.base.org
LIT_API_KEY=           # from dashboard.dev.litprotocol.com
LIT_USAGE_KEY=         # usage key with execute permissions
LIT_PKP_ID=            # your PKP wallet address
STORACHA_SPACE_DID=    # from npm run setup:storacha
REGISTRY_CONTRACT_ADDRESS=0xCa46735BF5c66575C8ac1E6302b539C4eBEa28F7
```

### Deploy contracts

```bash
cd contracts
npm install
npx hardhat run scripts/deploy.ts --network base
```

### Dashboard

```bash
cd dashboard
npm install
npm run dev
```

## Tech stack

- Node.js / TypeScript / Express
- Lit Protocol Chipotle V3 (REST API, TEE encryption, PKP signing)
- Storacha / IPFS / Filecoin (receipt storage)
- ERC-8004 (agent identity + reputation)
- Solidity / Hardhat / Base mainnet
- React / Vite (dashboard)
- Raspberry Pi 4 / systemd / Cloudflare Tunnel
- Docker (multi-node simulation)
