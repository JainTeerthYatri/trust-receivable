import mongoose, { Schema } from "mongoose";

const companySchema = new Schema(
  {
    legalName: { type: String, required: true },
    businessName: { type: String, required: true },
    GSTIN: { type: String, required: true, uppercase: true },
    UdyamNumber: { type: String, default: "" },
    PAN: { type: String, required: true, uppercase: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    industry: { type: String, required: true },
    verificationStatus: { type: String, enum: ["UNVERIFIED", "PENDING", "VERIFIED"], default: "UNVERIFIED" },
    trustScore: { type: Number, default: 50, min: 0, max: 100 },
    onTimePaymentRate: { type: Number, default: 0.8 },
    historicInvoiceCount: { type: Number, default: 0 }
  },
  { timestamps: true }
);

export type CompanyDoc = mongoose.InferSchemaType<typeof companySchema> & { _id: mongoose.Types.ObjectId };
export const Company = mongoose.model("Company", companySchema);
