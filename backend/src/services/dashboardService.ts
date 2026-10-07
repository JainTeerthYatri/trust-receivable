import { Invoice } from "../models/Invoice.js";
import { User } from "../models/User.js";
import { Company } from "../models/Company.js";
import { FinancingRequest } from "../models/FinancingRequest.js";
import { Dispute } from "../models/Dispute.js";
import { BlockchainTransaction } from "../models/BlockchainTransaction.js";
import { AuditLog } from "../models/AuditLog.js";
import { Payment } from "../models/Payment.js";

function inr(values: number[]) {
  return values.reduce((s, n) => s + n, 0);
}

export async function msmeDashboard(userId: string) {
  const invoices = await Invoice.find({ sellerId: userId }).populate("buyerCompany");
  const financed = invoices.filter((i) => i.financingStatus === "FINANCED");
  const pendingPay = invoices.filter((i) => i.paymentStatus !== "PAID" && i.lifecycleStatus !== "REJECTED");
  const available = invoices.filter((i) => i.lifecycleStatus === "FINANCING_AVAILABLE");
  const scores = invoices.map((i) => i.aiRiskScore || 50);
  const monthly = months().map((m) => ({
    month: m.label,
    receivables: invoices
      .filter((i) => new Date(i.invoiceDate).getMonth() === m.idx)
      .reduce((s, i) => s + i.amount, 0)
  }));
  return {
    kpis: {
      totalReceivables: inr(invoices.map((i) => i.amount)),
      verifiedInvoices: invoices.filter((i) => ["VERIFIED", "BUYER_PENDING", "ACCEPTED", "DELIVERY_VERIFIED", "FINANCING_AVAILABLE", "FINANCING_REQUESTED", "FINANCED", "PAYMENT_PENDING", "PAID"].includes(i.lifecycleStatus)).length,
      pendingPayments: inr(pendingPay.map((i) => i.amount)),
      financed: inr(financed.map((i) => i.amount)),
      availableFinancing: inr(available.map((i) => i.amount)),
      trustScore: scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 70
    },
    monthly,
    paidVsUnpaid: [
      { name: "Paid", value: inr(invoices.filter((i) => i.paymentStatus === "PAID").map((i) => i.amount)) },
      { name: "Unpaid", value: inr(invoices.filter((i) => i.paymentStatus !== "PAID").map((i) => i.amount)) }
    ],
    financing: [
      { name: "Requested", value: invoices.filter((i) => i.financingStatus === "REQUESTED").length },
      { name: "Financed", value: financed.length },
      { name: "Available", value: available.length }
    ],
    status: groupStatus(invoices),
    invoices
  };
}

export async function buyerDashboard(userId: string) {
  const invoices = await Invoice.find({ buyerId: userId }).populate("sellerCompany");
  return {
    kpis: {
      pending: invoices.filter((i) => i.buyerAcceptanceStatus === "PENDING").length,
      accepted: invoices.filter((i) => i.buyerAcceptanceStatus === "ACCEPTED").length,
      disputed: invoices.filter((i) => i.disputeStatus === "OPEN").length,
      totalPayable: inr(invoices.filter((i) => i.paymentStatus !== "PAID").map((i) => i.amount)),
      upcoming: invoices.filter((i) => i.paymentStatus !== "PAID" && i.buyerAcceptanceStatus === "ACCEPTED").length
    },
    invoices,
    payments: await Payment.find({ invoiceId: { $in: invoices.map((i) => i._id) } }).sort({ createdAt: -1 }).limit(20)
  };
}

export async function financierDashboard() {
  const requests = await FinancingRequest.find()
    .populate({ path: "invoiceId", populate: { path: "sellerCompany buyerCompany" } })
    .populate("sellerId")
    .sort({ createdAt: -1 });
  const invoices = await Invoice.find().populate("sellerCompany buyerCompany");
  const approved = requests.filter((r) => r.status === "APPROVED");
  return {
    kpis: {
      requests: requests.length,
      volume: approved.reduce((s, r) => s + (r.approvedAmount || 0), 0),
      approved: approved.length,
      pending: requests.filter((r) => r.status === "PENDING").length
    },
    risk: [
      { name: "Very low", value: invoices.filter((i) => i.fraudRiskLevel === "VERY_LOW").length },
      { name: "Low", value: invoices.filter((i) => i.fraudRiskLevel === "LOW").length },
      { name: "Medium", value: invoices.filter((i) => i.fraudRiskLevel === "MEDIUM").length },
      { name: "High", value: invoices.filter((i) => i.fraudRiskLevel === "HIGH").length }
    ],
    requests,
    invoices: invoices.filter((i) => ["FINANCING_AVAILABLE", "FINANCING_REQUESTED", "FINANCED", "PAYMENT_PENDING"].includes(i.lifecycleStatus))
  };
}

export async function adminDashboard() {
  const [users, companies, invoices, requests, disputes, txs, audits] = await Promise.all([
    User.find(),
    Company.find(),
    Invoice.find().populate("sellerCompany buyerCompany"),
    FinancingRequest.find(),
    Dispute.find().populate("invoiceId"),
    BlockchainTransaction.find().sort({ createdAt: -1 }).limit(50),
    AuditLog.find().sort({ createdAt: -1 }).limit(50)
  ]);
  return {
    kpis: {
      users: users.length,
      msmes: users.filter((u) => u.role === "msme").length,
      invoices: invoices.length,
      invoiceValue: invoices.reduce((s, i) => s + i.amount, 0),
      financed: invoices.filter((i) => i.financingStatus === "FINANCED").reduce((s, i) => s + i.amount, 0),
      fraudAlerts: invoices.filter((i) => i.duplicateLevel === "HIGH_RISK" || i.fraudRiskLevel === "HIGH").length,
      disputes: disputes.filter((d) => d.status === "OPEN").length
    },
    users,
    companies,
    invoices,
    requests,
    disputes,
    txs,
    audits,
    monthly: months().map((m) => ({
      month: m.label,
      value: invoices.filter((i) => new Date(i.createdAt).getMonth() === m.idx).reduce((s, i) => s + i.amount, 0)
    }))
  };
}

function months() {
  return ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map((label, idx) => ({ label, idx }));
}

function groupStatus(invoices: { lifecycleStatus: string }[]) {
  const map = new Map<string, number>();
  invoices.forEach((i) => map.set(i.lifecycleStatus, (map.get(i.lifecycleStatus) || 0) + 1));
  return [...map.entries()].map(([name, value]) => ({ name, value }));
}
