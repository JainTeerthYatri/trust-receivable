import mongoose, { Schema } from "mongoose";

const paymentSchema = new Schema(
  {
    invoiceId: { type: Schema.Types.ObjectId, ref: "Invoice", required: true },
    amount: { type: Number, required: true },
    paymentDate: { type: Date, default: Date.now },
    paymentMethod: { type: String, enum: ["NEFT", "RTGS", "UPI", "CHEQUE", "OTHER"], default: "NEFT" },
    reference: { type: String, required: true },
    status: { type: String, enum: ["RECORDED", "SETTLED"], default: "RECORDED" }
  },
  { timestamps: true }
);

export const Payment = mongoose.model("Payment", paymentSchema);
