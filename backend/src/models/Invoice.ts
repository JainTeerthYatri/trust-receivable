import mongoose, { Schema } from "mongoose";
import { LIFECYCLE } from "../types/domain.js";

const timelineSchema = new Schema(
  {
    status: { type: String, enum: LIFECYCLE, required: true },
    note: { type: String, required: true },
    actorId: { type: Schema.Types.ObjectId, ref: "User" },
    at: { type: Date, default: Date.now }
  },
  { _id: false }
);

const invoiceSchema = new Schema(
  {
    publicId: { type: String, required: true, unique: true },
    invoiceNumber: { type: String, required: true },
    sellerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    buyerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    buyerCompany: { type: Schema.Types.ObjectId, ref: "Company", required: true },
    sellerCompany: { type: Schema.Types.ObjectId, ref: "Company", required: true },
    amount: { type: Number, required: true, min: 1 },
    currency: { type: String, default: "INR" },
    invoiceDate: { type: Date, required: true },
    dueDate: { type: Date, required: true },
    purchaseOrderNumber: { type: String, default: "" },
    description: { type: String, required: true },
    documentUrl: { type: String, default: "" },
    documentHash: { type: String, default: "" },
    invoiceHash: { type: String, required: true, index: true },
    canonicalPayload: { type: Schema.Types.Mixed },
    blockchainTxHash: { type: String, default: "" },
    blockchainStatus: { type: String, enum: ["NOT_REGISTERED", "PENDING", "CONFIRMED", "MOCK"], default: "NOT_REGISTERED" },
    deliveryStatus: { type: String, enum: ["PENDING", "VERIFIED"], default: "PENDING" },
    buyerAcceptanceStatus: { type: String, enum: ["PENDING", "ACCEPTED", "REJECTED"], default: "PENDING" },
    financingStatus: { type: String, enum: ["NONE", "REQUESTED", "OFFERED", "APPROVED", "REJECTED", "FINANCED"], default: "NONE" },
    paymentStatus: { type: String, enum: ["UNPAID", "PARTIAL", "PAID"], default: "UNPAID" },
    disputeStatus: { type: String, enum: ["NONE", "OPEN", "RESOLVED"], default: "NONE" },
    lifecycleStatus: { type: String, enum: LIFECYCLE, default: "CREATED" },
    aiRiskScore: { type: Number, default: 50 },
    fraudRiskLevel: { type: String, enum: ["VERY_LOW", "LOW", "MEDIUM", "HIGH"], default: "MEDIUM" },
    trustReasons: [{ type: String }],
    duplicateLevel: { type: String, enum: ["SAFE", "POSSIBLE_DUPLICATE", "HIGH_RISK"], default: "SAFE" },
    duplicateNotes: [{ type: String }],
    financingBlocked: { type: Boolean, default: false },
    timeline: [timelineSchema]
  },
  { timestamps: true }
);

invoiceSchema.index({ sellerId: 1, invoiceNumber: 1 });
invoiceSchema.index({ buyerId: 1, createdAt: -1 });

export type InvoiceDoc = mongoose.InferSchemaType<typeof invoiceSchema> & { _id: mongoose.Types.ObjectId };
export const Invoice = mongoose.model("Invoice", invoiceSchema);
