import { Router } from "express";
import { z } from "zod";
import { Company } from "../models/Company.js";
import { User } from "../models/User.js";
import { authenticate, authorize, type AuthedRequest } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { NotFoundError } from "../utils/errors.js";

export const companyRouter = Router();

companyRouter.use(authenticate);

companyRouter.post("/", asyncHandler(async (req: AuthedRequest, res) => {
  const body = z.object({
    legalName: z.string(),
    businessName: z.string(),
    GSTIN: z.string(),
    UdyamNumber: z.string().optional().default(""),
    PAN: z.string(),
    address: z.string(),
    city: z.string(),
    state: z.string(),
    industry: z.string()
  }).parse(req.body);
  const company = await Company.create({ ...body, verificationStatus: "PENDING" });
  await User.findByIdAndUpdate(req.user!.id, { companyId: company._id });
  res.status(201).json(company);
}));

companyRouter.get("/buyers", authorize("msme", "admin", "financier"), asyncHandler(async (_req, res) => {
  const buyers = await User.find({ role: "buyer", isSuspended: false }).populate("companyId");
  res.json(buyers.map((b) => ({
    id: String(b._id),
    name: b.name,
    email: b.email,
    company: b.companyId
  })));
}));

companyRouter.get("/:id", asyncHandler(async (req, res) => {
  const company = await Company.findById(req.params.id);
  if (!company) throw new NotFoundError();
  res.json(company);
}));
