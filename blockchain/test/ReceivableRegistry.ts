import { expect } from "chai";
import { ethers } from "hardhat";

describe("ReceivableRegistry", () => {
  it("registers an invoice hash and prevents duplicates", async () => {
    const Factory = await ethers.getContractFactory("ReceivableRegistry");
    const registry = await Factory.deploy();
    const id = ethers.id("INV-1045");
    const hash = ethers.id("canonical-invoice");

    await expect(registry.registerInvoice(id, hash)).to.emit(registry, "InvoiceRegistered");
    await expect(registry.registerInvoice(id, hash)).to.be.revertedWith("Invoice already registered");

    const otherId = ethers.id("INV-1046");
    await expect(registry.registerInvoice(otherId, hash)).to.be.revertedWith("Hash already registered");

    const record = await registry.getInvoice(id);
    expect(record.exists).to.equal(true);
    expect(record.invoiceHash).to.equal(hash);
  });

  it("records lifecycle transitions", async () => {
    const Factory = await ethers.getContractFactory("ReceivableRegistry");
    const registry = await Factory.deploy();
    const id = ethers.id("INV-2001");
    const hash = ethers.id("hash-2001");
    await registry.registerInvoice(id, hash);
    await registry.verifyInvoice(id);
    await registry.acceptInvoice(id);
    await registry.markDelivered(id);
    const record = await registry.getInvoice(id);
    expect(record.state).to.equal(4);
  });
});
