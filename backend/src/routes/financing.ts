import { Router } from "express";
import { z } from "zod";
import { authenticate, authorize, type AuthedRequest } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { financierDecision } from "../services/invoiceService.js";
import { FinancingRequest } from "../models/FinancingRequest.js";

export const financingRouter = Router();
financingRouter.use(authenticate);

financingRouter.get("/requests", authorize("financier", "admin", "msme"), asyncHandler(async (req: AuthedRequest, res) => {
  const filter = req.user!.role === "msme" ? { sellerId: req.user!.id } : {};
  const rows = await FinancingRequest.find(filter)
    .populate({ path: "invoiceId", populate: { path: "sellerCompany buyerCompany" } })
    .populate("sellerId financierId")
    .sort({ createdAt: -1 });
  res.json(rows);
}));

financingRouter.post("/:id/approve", authorize("financier", "admin"), asyncHandler(async (req: AuthedRequest, res) => {
  const body = z.object({ approvedAmount: z.coerce.number().optional(), interestRate: z.coerce.number().optional() }).parse(req.body ?? {});
  res.json(await financierDecision(req.user!, req.params.id, "approve", body));
}));

financingRouter.post("/:id/reject", authorize("financier", "admin"), asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await financierDecision(req.user!, req.params.id, "reject", {}));
}));

financingRouter.post("/:id/offer", authorize("financier", "admin"), asyncHandler(async (req: AuthedRequest, res) => {
  const body = z.object({
    approvedAmount: z.coerce.number().optional(),
    interestRate: z.coerce.number().optional(),
    offerNote: z.string().optional()
  }).parse(req.body ?? {});
  res.json(await financierDecision(req.user!, req.params.id, "offer", body));
}));
