import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying AgentIdentity8004 with:", deployer.address);

  const Identity = await ethers.getContractFactory("AgentIdentity8004");
  const identity = await Identity.deploy();
  await identity.waitForDeployment();
  const addr = await identity.getAddress();
  console.log("AgentIdentity8004:", addr);
  console.log(`\nAGENT_IDENTITY_CONTRACT_ADDRESS=${addr}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
