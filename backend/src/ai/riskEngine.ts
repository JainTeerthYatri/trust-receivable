import { Invoice } from "../models/Invoice.js";
import { Payment } from "../models/Payment.js";
import { Dispute } from "../models/Dispute.js";
import { Company } from "../models/Company.js";

export type TrustResult = {
  score: number;
  category: "HIGH RISK" | "MEDIUM RISK" | "LOW RISK" | "VERY LOW RISK";
  reasons: string[];
  disclaimer: string;
};

function category(score: number): TrustResult["category"] {
  if (score <= 39) return "HIGH RISK";
  if (score <= 69) return "MEDIUM RISK";
  if (score <= 84) return "LOW RISK";
  return "VERY LOW RISK";
}

export async function computeReceivableTrustScore(invoiceId: string): Promise<TrustResult> {
  const invoice = await Invoice.findById(invoiceId);
  if (!invoice) {
    return {
      score: 0,
      category: "HIGH RISK",
      reasons: ["Invoice not found"],
      disclaimer: "Receivable Trust Score is a prototype indicator, not a regulated credit score."
    };
  }

  const [seller, buyer, payments, disputes, prior] = await Promise.all([
    Company.findById(invoice.sellerCompany),
    Company.findById(invoice.buyerCompany),
    Payment.find({ invoiceId }),
    Dispute.find({ invoiceId }),
    Invoice.find({ buyerCompany: invoice.buyerCompany, _id: { $ne: invoice._id } })
  ]);

  let score = 35;
  const reasons: string[] = [];

  if (seller?.verificationStatus === "VERIFIED") {
    score += 10;
    reasons.push("Seller business profile is verified");
  } else {
    score -= 8;
    reasons.push("Seller verification is incomplete");
  }

  if (buyer?.verificationStatus === "VERIFIED") {
    score += 12;
    reasons.push("Buyer verified");
  } else {
    score -= 10;
    reasons.push("Buyer verification is incomplete");
  }

  if (invoice.buyerAcceptanceStatus === "ACCEPTED") {
    score += 12;
    reasons.push("Invoice accepted by buyer");
  } else if (invoice.buyerAcceptanceStatus === "REJECTED") {
    score -= 25;
    reasons.push("Buyer rejected this invoice");
  } else {
    reasons.push("Buyer acceptance is still pending");
  }

  if (invoice.deliveryStatus === "VERIFIED") {
    score += 10;
    reasons.push("Delivery verified");
  } else {
    reasons.push("Delivery not yet confirmed");
  }

  if (invoice.duplicateLevel === "SAFE") {
    score += 10;
    reasons.push("No duplicate detected");
  } else if (invoice.duplicateLevel === "POSSIBLE_DUPLICATE") {
    score -= 12;
    reasons.push("Possible duplicate invoice markers found");
  } else {
    score -= 28;
    reasons.push("High-risk duplicate fingerprint detected");
  }

  const paidOnTime = prior.filter((p) => p.paymentStatus === "PAID").length;
  if (prior.length >= 2 && paidOnTime / prior.length >= 0.7) {
    score += 8;
    reasons.push("Strong buyer payment history");
  } else if (prior.length === 0) {
    reasons.push("Limited buyer payment history on this platform");
  } else {
    score -= 4;
    reasons.push("Uneven historic payment behaviour");
  }

  const openDisputes = disputes.filter((d) => d.status === "OPEN").length;
  if (openDisputes === 0 && invoice.disputeStatus === "NONE") {
    score += 6;
    reasons.push("No previous disputes on this receivable");
  } else {
    score -= 18;
    reasons.push("Dispute activity reduces receivable confidence");
  }

  if (invoice.amount > 2500000) {
    score -= 6;
    reasons.push("Invoice amount is large relative to typical MSME ticket size");
  } else {
    reasons.push("Invoice amount is within typical working-capital range");
  }

  if (invoice.financingStatus === "FINANCED") {
    score -= 5;
    reasons.push("Receivable already has a financing mark");
  }

  if (payments.length && invoice.paymentStatus === "PAID") {
    score += 4;
    reasons.push("Payment already recorded against this invoice");
  }

  score = Math.max(0, Math.min(100, Math.round(score)));

  await Invoice.findByIdAndUpdate(invoiceId, {
    aiRiskScore: score,
    fraudRiskLevel: score >= 85 ? "VERY_LOW" : score >= 70 ? "LOW" : score >= 40 ? "MEDIUM" : "HIGH",
    trustReasons: reasons
  });

  if (buyer) {
    const avg =
      prior.length === 0
        ? score
        : Math.round((prior.reduce((s, i) => s + (i.aiRiskScore || 50), 0) + score) / (prior.length + 1));
    await Company.findByIdAndUpdate(buyer._id, { trustScore: avg });
  }

  return {
    score,
    category: category(score),
    reasons,
    disclaimer: "Receivable Trust Score is a prototype indicator for demo purposes. It is not a regulated credit score or bureau report."
  };
}
