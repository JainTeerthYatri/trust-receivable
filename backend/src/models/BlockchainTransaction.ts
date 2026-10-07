import mongoose, { Schema } from "mongoose";

const blockchainSchema = new Schema(
  {
    invoiceId: { type: Schema.Types.ObjectId, ref: "Invoice", required: true },
    invoiceHash: { type: String, required: true },
    transactionHash: { type: String, required: true },
    contractAddress: { type: String, required: true },
    network: { type: String, required: true },
    blockNumber: { type: Number, default: 0 },
    timestamp: { type: Date, default: Date.now },
    action: { type: String, required: true },
    mode: { type: String, enum: ["LIVE", "MOCK"], default: "LIVE" }
  },
  { timestamps: true }
);

export const BlockchainTransaction = mongoose.model("BlockchainTransaction", blockchainSchema);
