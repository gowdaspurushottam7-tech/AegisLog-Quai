const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("LogAnchor Contract", function () {
  let logAnchor;
  let owner;

  beforeEach(async function () {
    [owner] = await ethers.getSigners();
    const LogAnchor = await ethers.getContractFactory("LogAnchor");
    logAnchor = await LogAnchor.deploy();
    await logAnchor.waitForDeployment();
  });

  it("Should start with 0 batches", async function () {
    expect(await logAnchor.getTotalBatches()).to.equal(0);
  });

  it("Should anchor a batch and retrieve it", async function () {
    const dummyRoot = ethers.keccak256(ethers.toUtf8Bytes("test-batch-merkle-root"));
    const vaultRef = "vault/batch_1.enc";
    const ntpTimestamp = Math.floor(Date.now() / 1000);
    const logCount = 5;

    const tx = await logAnchor.anchorBatch(dummyRoot, vaultRef, ntpTimestamp, logCount);
    await tx.wait();

    expect(await logAnchor.getTotalBatches()).to.equal(1);

    const batch = await logAnchor.getBatch(1);
    expect(batch.batchId).to.equal(1);
    expect(batch.merkleRoot).to.equal(dummyRoot);
    expect(batch.vaultRef).to.equal(vaultRef);
    expect(batch.ntpTimestamp).to.equal(ntpTimestamp);
    expect(batch.logCount).to.equal(logCount);

    const latest = await logAnchor.getLatestBatch();
    expect(latest.batchId).to.equal(1);
    expect(latest.merkleRoot).to.equal(dummyRoot);
  });
});
