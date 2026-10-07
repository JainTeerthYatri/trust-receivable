import mongoose, { Schema } from "mongoose";
import type { Role } from "../types/domain.js";

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    phone: { type: String, required: true },
    role: { type: String, enum: ["msme", "buyer", "financier", "admin"], required: true },
    companyId: { type: Schema.Types.ObjectId, ref: "Company" },
    isVerified: { type: Boolean, default: false },
    isSuspended: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export type UserDoc = mongoose.InferSchemaType<typeof userSchema> & { _id: mongoose.Types.ObjectId; role: Role };
export const User = mongoose.model("User", userSchema);
