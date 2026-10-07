import { Invoice } from "../models/Invoice.js";
import type { DuplicateLevel } from "../types/domain.js";

export async function detectDuplicate(input: {
  invoiceId?: string;
  invoiceNumber: string;
  sellerId: string;
  buyerId: string;
  amount: number;
  invoiceDate: Date;
  purchaseOrderNumber: string;
  invoiceHash: string;
}) {
 const allInvoices = await Invoice.find().lean();
  const others = input.invoiceId 
    ? allInvoices.filter((inv) => String(inv._id) !== String(input.invoiceId))
    : allInvoices;
  const notes: string[] = [];
  let score = 0;

  for (const inv of others) {
    if (inv.invoiceHash === input.invoiceHash) {
      score += 80;
      notes.push(`Identical cryptographic fingerprint already exists (${inv.publicId})`);
    }
    const sameSeller = String(inv.sellerId) === String(input.sellerId);
    const sameNumber = inv.invoiceNumber.toUpperCase() === input.invoiceNumber.toUpperCase();
    const sameBuyer = String(inv.buyerId) === String(input.buyerId);
    const sameAmount = Number(inv.amount) === Number(input.amount);
    const sameDate = new Date(inv.invoiceDate).toISOString().slice(0, 10) === input.invoiceDate.toISOString().slice(0, 10);
    const samePo =
      (inv.purchaseOrderNumber || "").toUpperCase() === (input.purchaseOrderNumber || "").toUpperCase() &&
      Boolean(input.purchaseOrderNumber);

    if (sameSeller && sameNumber) {
      score += 70;
      notes.push(`Same seller reused invoice number ${input.invoiceNumber}`);
    }
    if (sameSeller && sameBuyer && sameAmount && sameDate) {
      score += 40;
      notes.push("Same seller, buyer, amount and invoice date already present");
    }
    if (samePo && sameSeller) {
      score += 15;
      notes.push("Matching purchase order on another invoice from this seller");
    }
  }

  let level: DuplicateLevel = "SAFE";
  if (score >= 70) level = "HIGH_RISK";
  else if (score >= 25) level = "POSSIBLE_DUPLICATE";

  return {
    level,
    notes: notes.length ? notes : ["No overlapping invoice fingerprint or identity markers found"],
    financingBlocked: level === "HIGH_RISK"
  };
}
