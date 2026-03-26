#!/bin/bash
set -e

echo "=== Darkpool Raspberry Pi Setup ==="

sudo apt update && sudo apt upgrade -y

curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs git

cd ~
if [ ! -d "darkpool" ]; then
  git clone https://github.com/YOUR_USERNAME/darkpool.git
fi

cd darkpool/node
npm install
npm run build

sudo tee /etc/systemd/system/darkpool.service > /dev/null <<EOF
[Unit]
Description=Darkpool Relay Node
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$(pwd)
ExecStart=/usr/bin/node dist/index.js
Restart=always
RestartSec=10
Environment=NODE_PORT=8545
Environment=NODE_ID=darkpool-pi-node
Environment=NETWORK=sepolia

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable darkpool
sudo systemctl start darkpool

echo ""
echo "Darkpool node running on port 8545"
echo "Point your wallet RPC to: http://$(hostname -I | awk '{print $1}'):8545"
echo "Check status: sudo systemctl status darkpool"
echo "View logs: sudo journalctl -u darkpool -f"
