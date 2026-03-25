import { expect } from "chai";
import { ethers } from "hardhat";

describe("DarkpoolRegistry", function () {
  async function deploy() {
    const [owner, node1, node2] = await ethers.getSigners();
    const Registry = await ethers.getContractFactory("DarkpoolRegistry");
    const registry = await Registry.deploy();
    return { registry, owner, node1, node2 };
  }

  it("registers a node", async function () {
    const { registry, node1 } = await deploy();
    await registry.connect(node1).registerNode("http://localhost:8545", "0x1234");
    const node = await registry.nodes(node1.address);
    expect(node.active).to.be.true;
    expect(node.endpoint).to.equal("http://localhost:8545");
  });

  it("prevents double registration", async function () {
    const { registry, node1 } = await deploy();
    await registry.connect(node1).registerNode("http://localhost:8545", "0x1234");
    await expect(registry.connect(node1).registerNode("http://localhost:8546", "0x5678")).to.be.revertedWith("Already registered");
  });

  it("records relay and updates stats", async function () {
    const { registry, node1 } = await deploy();
    await registry.connect(node1).registerNode("http://localhost:8545", "0x1234");
    const bundleHash = ethers.keccak256(ethers.toUtf8Bytes("bundle1"));
    await registry.connect(node1).recordRelay(bundleHash, ethers.parseEther("0.5"), "bafyexamplecid");
    const node = await registry.nodes(node1.address);
    expect(node.totalRelays).to.equal(1);
    expect(node.totalMevSaved).to.equal(ethers.parseEther("0.5"));
    const stats = await registry.getNetworkStats();
    expect(stats[1]).to.equal(1);
  });

  it("returns active nodes", async function () {
    const { registry, node1, node2 } = await deploy();
    await registry.connect(node1).registerNode("http://localhost:8545", "0x1234");
    await registry.connect(node2).registerNode("http://localhost:8546", "0x5678");
    const active = await registry.getActiveNodes();
    expect(active.length).to.equal(2);
    await registry.connect(node1).deactivateNode();
    const activeAfter = await registry.getActiveNodes();
    expect(activeAfter.length).to.equal(1);
  });
});
