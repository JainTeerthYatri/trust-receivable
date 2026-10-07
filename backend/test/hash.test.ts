import { describe, expect, it } from "vitest";
import { fingerprintInvoice } from "../src/utils/hash.js";
import { categoryFromScore } from "./helpers.js";

describe("invoice fingerprint", () => {
  it("is stable for canonical fields", () => {
    const a = fingerprintInvoice({
      invoiceNumber: "inv-1045",
      seller: "ABC Manufacturing",
      buyer: "XYZ Industries",
      amount: 1000000,
      invoiceDate: "2026-10-01T00:00:00.000Z",
      purchaseOrder: "PO-1",
      dueDate: "2026-11-01"
    });
    const b = fingerprintInvoice({
      invoiceNumber: "INV-1045",
      seller: "abc manufacturing",
      buyer: "xyz industries",
      amount: 1000000.0,
      invoiceDate: "2026-10-01",
      purchaseOrder: "po-1",
      dueDate: "2026-11-01"
    });
    expect(a.invoiceHash).toBe(b.invoiceHash);
    expect(a.invoiceHash).toHaveLength(64);
  });
});

describe("trust bands", () => {
  it("maps scores to disclosed categories", () => {
    expect(categoryFromScore(93)).toBe("VERY LOW RISK");
    expect(categoryFromScore(72)).toBe("LOW RISK");
    expect(categoryFromScore(50)).toBe("MEDIUM RISK");
    expect(categoryFromScore(20)).toBe("HIGH RISK");
  });
});
