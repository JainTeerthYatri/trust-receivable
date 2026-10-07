import { randomBytes } from "crypto";
import QRCode from "qrcode";
import { Invoice } from "../models/Invoice.js";
import { Company } from "../models/Company.js";
import { User } from "../models/User.js";
import { Payment } from "../models/Payment.js";
import { Dispute } from "../models/Dispute.js";
import { FinancingRequest } from "../models/FinancingRequest.js";
import { BlockchainTransaction } from "../models/BlockchainTransaction.js";
import { fingerprintInvoice } from "../utils/hash.js";
import { detectDuplicate } from "../ai/duplicate.js";
import { computeReceivableTrustScore } from "../ai/riskEngine.js";
import { executeChainAction, readOnChain } from "../blockchain/service.js";
import { audit, notify } from "./notify.js";
import { AppError, ForbiddenError, NotFoundError } from "../utils/errors.js";
import { env } from "../config/env.js";
import type { LifecycleStatus } from "../types/domain.js";
import mongoose, { type Types } from "mongoose";

function invoiceFilter(id: string) {
  return mongoose.isValidObjectId(id) ? { $or: [{ publicId: id }, { _id: id }] } : { publicId: id };
}

function publicId() {
  return `TR-${randomBytes(4).toString("hex").toUpperCase()}`;
}

function pushTimeline(invoice: { timeline: { status: LifecycleStatus; note: string; actorId?: Types.ObjectId; at?: Date }[] }, status: LifecycleStatus, note: string, actorId?: string) {
  invoice.timeline.push({ status, note, actorId: actorId as unknown as Types.ObjectId, at: new Date() });
}

export async function createInvoice(actor: { id: string; role: string }, body: {
  invoiceNumber: string;
  buyerId: string;
  amount: number;
  invoiceDate: string;
  dueDate: string;
  purchaseOrderNumber?: string;
  description: string;
  documentUrl?: string;
  documentHash?: string;
}) {
  if (actor.role !== "msme" && actor.role !== "admin") throw new ForbiddenError();
  const seller = await User.findById(actor.id);
  if (!seller?.companyId) throw new AppError("Complete your company profile before creating invoices");
  const buyer = await User.findById(body.buyerId);
  if (!buyer?.companyId || buyer.role !== "buyer") throw new AppError("Select a valid buyer organisation");

  const sellerCo = await Company.findById(seller.companyId);
  const buyerCo = await Company.findById(buyer.companyId);
  if (!sellerCo || !buyerCo) throw new AppError("Company records missing");

  const { canonical, invoiceHash } = fingerprintInvoice({
    invoiceNumber: body.invoiceNumber,
    seller: sellerCo.legalName,
    buyer: buyerCo.legalName,
    amount: body.amount,
    invoiceDate: body.invoiceDate,
    purchaseOrder: body.purchaseOrderNumber || "",
    dueDate: body.dueDate
  });

  const dup = await detectDuplicate({
    invoiceNumber: body.invoiceNumber,
    sellerId: String(seller._id),
    buyerId: String(buyer._id),
    amount: body.amount,
    invoiceDate: new Date(body.invoiceDate),
    purchaseOrderNumber: body.purchaseOrderNumber || "",
    invoiceHash
  });

  const invoice = await Invoice.create({
    publicId: publicId(),
    invoiceNumber: body.invoiceNumber,
    sellerId: seller._id,
    buyerId: buyer._id,
    buyerCompany: buyerCo._id,
    sellerCompany: sellerCo._id,
    amount: body.amount,
    invoiceDate: body.invoiceDate,
    dueDate: body.dueDate,
    purchaseOrderNumber: body.purchaseOrderNumber || "",
    description: body.description,
    documentUrl: body.documentUrl || "",
    documentHash: body.documentHash || "",
    invoiceHash,
    canonicalPayload: canonical,
    lifecycleStatus: "CREATED",
    duplicateLevel: dup.level,
    duplicateNotes: dup.notes,
    financingBlocked: dup.financingBlocked,
    timeline: [{ status: "CREATED", note: "Invoice created and fingerprinted", actorId: seller._id, at: new Date() }]
  });

  await notify(String(buyer._id), "Invoice received", `${sellerCo.businessName} sent invoice ${invoice.invoiceNumber}`, "invoice_created");
  await notify(String(seller._id), "Invoice created", `Invoice ${invoice.invoiceNumber} is ready for verification`, "invoice_created");
  await audit(actor.id, "invoice.create", "Invoice", invoice.publicId);
  await computeReceivableTrustScore(String(invoice._id));
  return Invoice.findById(invoice._id).populate("sellerCompany buyerCompany sellerId buyerId");
}

export async function verifyInvoice(actor: { id: string; role: string }, id: string) {
  const invoice = await findOwned(id);
  if (actor.role === "msme" && String(invoice.sellerId) !== actor.id) throw new ForbiddenError();
  invoice.lifecycleStatus = "VERIFIED";
  pushTimeline(invoice, "VERIFIED", "Platform verification checks completed", actor.id);
  await invoice.save();
  await notify(String(invoice.sellerId), "Invoice verified", `${invoice.invoiceNumber} passed verification`, "invoice_verified");
  await computeReceivableTrustScore(String(invoice._id));
  return invoice;
}

export async function registerOnChain(actor: { id: string; role: string }, id: string) {
  const invoice = await findOwned(id);
  if (actor.role === "msme" && String(invoice.sellerId) !== actor.id) throw new ForbiddenError();
  const result = await executeChainAction({
    invoiceMongoId: String(invoice._id),
    publicId: invoice.publicId,
    invoiceHash: invoice.invoiceHash,
    action: "registerInvoice"
  });
  invoice.lifecycleStatus = "BUYER_PENDING";
  pushTimeline(invoice, "BUYER_PENDING", `Cryptographic proof ${result.mode === "LIVE" ? "registered on-chain" : "recorded in labeled mock mode"}`, actor.id);
  await invoice.save();
  if (result.mode === "LIVE") {
    await executeChainAction({
      invoiceMongoId: String(invoice._id),
      publicId: invoice.publicId,
      invoiceHash: invoice.invoiceHash,
      action: "verifyInvoice"
    });
  }
  await computeReceivableTrustScore(String(invoice._id));
  return { invoice, chain: result };
}

export async function buyerDecision(actor: { id: string; role: string }, id: string, decision: "accept" | "reject", reason?: string) {
  const invoice = await findOwned(id);
  if (actor.role !== "admin" && String(invoice.buyerId) !== actor.id) throw new ForbiddenError();
  if (decision === "accept") {
    invoice.buyerAcceptanceStatus = "ACCEPTED";
    invoice.lifecycleStatus = "ACCEPTED";
    pushTimeline(invoice, "ACCEPTED", "Buyer accepted the invoice", actor.id);
    await notify(String(invoice.sellerId), "Buyer accepted invoice", `${invoice.invoiceNumber} was accepted`, "buyer_accepted");
    if (invoice.blockchainStatus !== "NOT_REGISTERED") {
      await executeChainAction({
        invoiceMongoId: String(invoice._id),
        publicId: invoice.publicId,
        invoiceHash: invoice.invoiceHash,
        action: "acceptInvoice"
      });
    }
  } else {
    invoice.buyerAcceptanceStatus = "REJECTED";
    invoice.lifecycleStatus = "REJECTED";
    pushTimeline(invoice, "REJECTED", reason || "Buyer rejected the invoice", actor.id);
    await notify(String(invoice.sellerId), "Buyer rejected invoice", `${invoice.invoiceNumber} was rejected`, "buyer_rejected");
  }
  await invoice.save();
  await computeReceivableTrustScore(String(invoice._id));
  return invoice;
}

export async function confirmDelivery(actor: { id: string; role: string }, id: string) {
  const invoice = await findOwned(id);
  if (actor.role !== "admin" && String(invoice.buyerId) !== actor.id) throw new ForbiddenError();
  invoice.deliveryStatus = "VERIFIED";
  invoice.lifecycleStatus = "DELIVERY_VERIFIED";
  if (!invoice.financingBlocked && invoice.buyerAcceptanceStatus === "ACCEPTED") {
    invoice.lifecycleStatus = "FINANCING_AVAILABLE";
    pushTimeline(invoice, "DELIVERY_VERIFIED", "Delivery confirmed by buyer", actor.id);
    pushTimeline(invoice, "FINANCING_AVAILABLE", "Receivable is finance-ready", actor.id);
  } else {
    pushTimeline(invoice, "DELIVERY_VERIFIED", "Delivery confirmed — financing blocked pending review", actor.id);
  }
  await invoice.save();
  if (invoice.blockchainStatus !== "NOT_REGISTERED") {
    await executeChainAction({
      invoiceMongoId: String(invoice._id),
      publicId: invoice.publicId,
      invoiceHash: invoice.invoiceHash,
      action: "markDelivered"
    });
  }
  await notify(String(invoice.sellerId), "Delivery verified", `Buyer confirmed delivery for ${invoice.invoiceNumber}`, "delivery_verified");
  await computeReceivableTrustScore(String(invoice._id));
  return invoice;
}

export async function raiseDispute(actor: { id: string; role: string }, id: string, payload: { reason: string; description: string; evidence?: string }) {
  const invoice = await findOwned(id);
  if (actor.role !== "admin" && String(invoice.buyerId) !== actor.id && String(invoice.sellerId) !== actor.id) {
    throw new ForbiddenError();
  }
  invoice.disputeStatus = "OPEN";
  invoice.lifecycleStatus = "DISPUTED";
  invoice.financingBlocked = true;
  pushTimeline(invoice, "DISPUTED", payload.reason, actor.id);
  await invoice.save();
  await Dispute.create({
    invoiceId: invoice._id,
    raisedBy: actor.id,
    reason: payload.reason,
    description: payload.description,
    evidence: payload.evidence || ""
  });
  if (invoice.blockchainStatus !== "NOT_REGISTERED") {
    await executeChainAction({
      invoiceMongoId: String(invoice._id),
      publicId: invoice.publicId,
      invoiceHash: invoice.invoiceHash,
      action: "markDisputed"
    });
  }
  await notify(String(invoice.sellerId), "Dispute raised", payload.reason, "dispute_raised");
  await notify(String(invoice.buyerId), "Dispute raised", payload.reason, "dispute_raised");
  await computeReceivableTrustScore(String(invoice._id));
  return invoice;
}

export async function requestFinancing(actor: { id: string; role: string }, id: string, payload: { requestedAmount: number; requestedTenure: number }) {
  const invoice = await findOwned(id);
  if (actor.role === "msme" && String(invoice.sellerId) !== actor.id) throw new ForbiddenError();
  if (invoice.financingBlocked) throw new AppError("Financing is blocked until duplicate/dispute review is complete");
  if (invoice.lifecycleStatus !== "FINANCING_AVAILABLE" && invoice.lifecycleStatus !== "DELIVERY_VERIFIED") {
    throw new AppError("Receivable is not yet finance-ready");
  }
  invoice.financingStatus = "REQUESTED";
  invoice.lifecycleStatus = "FINANCING_REQUESTED";
  pushTimeline(invoice, "FINANCING_REQUESTED", `Financing requested for ₹${payload.requestedAmount.toLocaleString("en-IN")}`, actor.id);
  await invoice.save();
  const request = await FinancingRequest.create({
    invoiceId: invoice._id,
    sellerId: invoice.sellerId,
    requestedAmount: payload.requestedAmount,
    requestedTenure: payload.requestedTenure
  });
  if (invoice.blockchainStatus !== "NOT_REGISTERED") {
    await executeChainAction({
      invoiceMongoId: String(invoice._id),
      publicId: invoice.publicId,
      invoiceHash: invoice.invoiceHash,
      action: "requestFinancing"
    });
  }
  const financiers = await User.find({ role: "financier", isSuspended: false });
  await Promise.all(
    financiers.map((f) =>
      notify(String(f._id), "New financing request", `${invoice.invoiceNumber} is requesting working capital`, "financing_requested")
    )
  );
  await computeReceivableTrustScore(String(invoice._id));
  return { invoice, request };
}

export async function financierDecision(
  actor: { id: string; role: string },
  requestId: string,
  decision: "approve" | "reject" | "offer",
  payload: { approvedAmount?: number; interestRate?: number; offerNote?: string }
) {
  if (actor.role !== "financier" && actor.role !== "admin") throw new ForbiddenError();
  const request = await FinancingRequest.findById(requestId);
  if (!request) throw new NotFoundError("Financing request not found");
  const invoice = await Invoice.findById(request.invoiceId);
  if (!invoice) throw new NotFoundError();

  request.financierId = actor.id as unknown as Types.ObjectId;
  request.decisionDate = new Date();
  if (decision === "reject") {
    request.status = "REJECTED";
    invoice.financingStatus = "REJECTED";
    pushTimeline(invoice, invoice.lifecycleStatus, "Financier declined the request", actor.id);
    await notify(String(invoice.sellerId), "Financing rejected", `${invoice.invoiceNumber} was not approved`, "financing_rejected");
  } else if (decision === "offer") {
    request.status = "OFFERED";
    request.approvedAmount = payload.approvedAmount || request.requestedAmount;
    request.interestRate = payload.interestRate || 14;
    request.offerNote = payload.offerNote || "";
    invoice.financingStatus = "OFFERED";
    pushTimeline(invoice, invoice.lifecycleStatus, "Financier submitted an offer", actor.id);
    await notify(String(invoice.sellerId), "Financing offer received", `Offer on ${invoice.invoiceNumber}`, "financing_offered");
  } else {
    request.status = "APPROVED";
    request.approvedAmount = payload.approvedAmount || request.requestedAmount;
    request.interestRate = payload.interestRate || 13.5;
    invoice.financingStatus = "FINANCED";
    invoice.lifecycleStatus = "FINANCED";
    pushTimeline(invoice, "FINANCED", "Financier approved financing (demo decision record, not a loan disbursement)", actor.id);
    pushTimeline(invoice, "PAYMENT_PENDING", "Awaiting buyer settlement", actor.id);
    invoice.lifecycleStatus = "PAYMENT_PENDING";
    await notify(String(invoice.sellerId), "Financing approved", `${invoice.invoiceNumber} is marked financed`, "financing_approved");
    if (invoice.blockchainStatus !== "NOT_REGISTERED") {
      await executeChainAction({
        invoiceMongoId: String(invoice._id),
        publicId: invoice.publicId,
        invoiceHash: invoice.invoiceHash,
        action: "markFinanced"
      });
    }
  }
  await request.save();
  await invoice.save();
  await computeReceivableTrustScore(String(invoice._id));
  return { request, invoice };
}

export async function markPaid(actor: { id: string; role: string }, id: string, payload: { amount: number; paymentMethod: string; reference: string }) {
  const invoice = await findOwned(id);
  if (actor.role !== "admin" && String(invoice.buyerId) !== actor.id) throw new ForbiddenError();
  await Payment.create({
    invoiceId: invoice._id,
    amount: payload.amount,
    paymentMethod: payload.paymentMethod,
    reference: payload.reference,
    status: "SETTLED"
  });
  invoice.paymentStatus = payload.amount >= invoice.amount ? "PAID" : "PARTIAL";
  if (invoice.paymentStatus === "PAID") {
    invoice.lifecycleStatus = "PAID";
    pushTimeline(invoice, "PAID", "Buyer recorded settlement of the receivable", actor.id);
    if (invoice.blockchainStatus !== "NOT_REGISTERED") {
      await executeChainAction({
        invoiceMongoId: String(invoice._id),
        publicId: invoice.publicId,
        invoiceHash: invoice.invoiceHash,
        action: "markPaid"
      });
    }
  }
  await invoice.save();
  await notify(String(invoice.sellerId), "Payment received", `Settlement recorded for ${invoice.invoiceNumber}`, "payment_received");
  await computeReceivableTrustScore(String(invoice._id));
  return invoice;
}

export async function getPassport(id: string) {
  const invoice = await Invoice.findOne(invoiceFilter(id)).populate("sellerCompany buyerCompany sellerId buyerId");
  if (!invoice) throw new NotFoundError("Invoice not found");
  const [payments, disputes, chain, trust] = await Promise.all([
    Payment.find({ invoiceId: invoice._id }),
    Dispute.find({ invoiceId: invoice._id }),
    BlockchainTransaction.find({ invoiceId: invoice._id }).sort({ createdAt: -1 }),
    computeReceivableTrustScore(String(invoice._id))
  ]);
  const onchain = await readOnChain(invoice.publicId);
  return { invoice, payments, disputes, chain, trust, onchain };
}

export async function publicVerify(id: string) {
  const passport = await getPassport(id);
  const inv = passport.invoice;
  return {
    invoice: inv.invoiceNumber,
    publicId: inv.publicId,
    amount: inv.amount,
    currency: inv.currency,
    status: inv.lifecycleStatus,
    blockchain: inv.blockchainStatus,
    buyerAcceptance: inv.buyerAcceptanceStatus,
    delivery: inv.deliveryStatus,
    duplicate: inv.duplicateLevel,
    trustScore: passport.trust.score,
    trustCategory: passport.trust.category,
    transactionHash: inv.blockchainTxHash,
    contractMode: passport.onchain.mode,
    disclaimer: "Public view shows verification status only. This is a technology prototype, not a government or credit-bureau service."
  };
}

export async function qrPayload(id: string) {
  const invoice = await Invoice.findOne({ publicId: id });
  if (!invoice) throw new NotFoundError();
  const url = `${env.frontendUrl}/verify/${invoice.publicId}`;
  const dataUrl = await QRCode.toDataURL(url, { margin: 1, width: 280 });
  return { url, dataUrl };
}

async function findOwned(id: string) {
  const invoice = await Invoice.findOne(invoiceFilter(id));
  if (!invoice) throw new NotFoundError("Invoice not found");
  return invoice;
}

export async function listInvoices(actor: { id: string; role: string }) {
  const filter =
    actor.role === "admin"
      ? {}
      : actor.role === "msme"
        ? { sellerId: actor.id }
        : actor.role === "buyer"
          ? { buyerId: actor.id }
          : {};
  return Invoice.find(filter).populate("sellerCompany buyerCompany").sort({ createdAt: -1 });
}
