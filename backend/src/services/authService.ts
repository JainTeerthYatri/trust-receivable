import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { User } from "../models/User.js";
import { Company } from "../models/Company.js";
import { env } from "../config/env.js";
import { AppError, UnauthorizedError } from "../utils/errors.js";
import type { Role } from "../types/domain.js";

export const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  phone: z.string().min(10),
  role: z.enum(["msme", "buyer", "financier"]),
  company: z.object({
    legalName: z.string().min(2),
    businessName: z.string().min(2),
    GSTIN: z.string().min(10),
    UdyamNumber: z.string().optional().default(""),
    PAN: z.string().min(8),
    address: z.string().min(4),
    city: z.string().min(2),
    state: z.string().min(2),
    industry: z.string().min(2)
  })
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

function signToken(userId: string, role: Role) {
  return jwt.sign({ sub: userId, role }, env.jwtSecret, { expiresIn: env.jwtExpiresIn as jwt.SignOptions["expiresIn"] });
}

export async function registerUser(input: z.infer<typeof registerSchema>) {
  const existing = await User.findOne({ email: input.email.toLowerCase() });
  if (existing) throw new AppError("An account with this email already exists");
  const company = await Company.create({
    ...input.company,
    GSTIN: input.company.GSTIN.toUpperCase(),
    PAN: input.company.PAN.toUpperCase(),
    verificationStatus: "PENDING",
    trustScore: 55
  });
  const passwordHash = await bcrypt.hash(input.password, 12);
  const user = await User.create({
    name: input.name,
    email: input.email.toLowerCase(),
    passwordHash,
    phone: input.phone,
    role: input.role,
    companyId: company._id,
    isVerified: false
  });
  const token = signToken(String(user._id), user.role as Role);
  return { token, user: sanitize(user), company };
}

export async function loginUser(input: z.infer<typeof loginSchema>) {
  const user = await User.findOne({ email: input.email.toLowerCase() }).select("+passwordHash");
  if (!user) throw new UnauthorizedError("Invalid email or password");
  if (user.isSuspended) throw new UnauthorizedError("This account has been suspended");
  const ok = await bcrypt.compare(input.password, user.passwordHash);
  if (!ok) throw new UnauthorizedError("Invalid email or password");
  const token = signToken(String(user._id), user.role as Role);
  const company = user.companyId ? await Company.findById(user.companyId) : null;
  return { token, user: sanitize(user), company };
}

export function sanitize(user: { _id: unknown; name: string; email: string; phone: string; role: string; companyId?: unknown; isVerified: boolean }) {
  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    companyId: user.companyId ? String(user.companyId) : null,
    isVerified: user.isVerified
  };
}
