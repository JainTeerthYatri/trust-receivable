import mongoose, { Schema } from "mongoose";

const disputeSchema = new Schema(
  {
    invoiceId: { type: Schema.Types.ObjectId, ref: "Invoice", required: true },
    raisedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    reason: { type: String, required: true },
    description: { type: String, required: true },
    evidence: { type: String, default: "" },
    status: { type: String, enum: ["OPEN", "RESOLVED"], default: "OPEN" },
    resolution: { type: String, default: "" }
  },
  { timestamps: true }
);

export const Dispute = mongoose.model("Dispute", disputeSchema);
