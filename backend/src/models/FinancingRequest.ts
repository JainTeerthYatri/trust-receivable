import mongoose, { Schema } from "mongoose";

const financingSchema = new Schema(
  {
    invoiceId: { type: Schema.Types.ObjectId, ref: "Invoice", required: true },
    sellerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    requestedAmount: { type: Number, required: true },
    requestedTenure: { type: Number, required: true },
    requestedDate: { type: Date, default: Date.now },
    status: { type: String, enum: ["PENDING", "OFFERED", "APPROVED", "REJECTED"], default: "PENDING" },
    financierId: { type: Schema.Types.ObjectId, ref: "User" },
    approvedAmount: { type: Number, default: 0 },
    interestRate: { type: Number, default: 0 },
    offerNote: { type: String, default: "" },
    decisionDate: { type: Date }
  },
  { timestamps: true }
);

export const FinancingRequest = mongoose.model("FinancingRequest", financingSchema);
