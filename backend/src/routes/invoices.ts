import { Router } from "express";
import { z } from "zod";
import fs from "fs";
import { authenticate, authorize, type AuthedRequest } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { upload } from "../middleware/upload.js";
import { env } from "../config/env.js";
import { hashDocument } from "../utils/hash.js";
import {
  buyerDecision,
  confirmDelivery,
  createInvoice,
  getPassport,
  listInvoices,
  markPaid,
  qrPayload,
  raiseDispute,
  registerOnChain,
  requestFinancing,
  verifyInvoice
} from "../services/invoiceService.js";
import { readOnChain } from "../blockchain/service.js";
import mongoose from "mongoose";
import { Invoice } from "../models/Invoice.js";
import { NotFoundError } from "../utils/errors.js";

function invoiceFilter(id: string) {
  return mongoose.isValidObjectId(id) ? { $or: [{ publicId: id }, { _id: id }] } : { publicId: id };
}

export const invoiceRouter = Router();
invoiceRouter.use(authenticate);

const createSchema = z.object({
  invoiceNumber: z.string().min(3),
  buyerId: z.string(),
  amount: z.coerce.number().positive(),
  invoiceDate: z.string(),
  dueDate: z.string(),
  purchaseOrderNumber: z.string().optional(),
  description: z.string().min(4),
  documentUrl: z.string().optional(),
  documentHash: z.string().optional()
});

invoiceRouter.post("/", asyncHandler(async (req: AuthedRequest, res) => {
  const invoice = await createInvoice(req.user!, createSchema.parse(req.body));
  res.status(201).json(invoice);
}));

invoiceRouter.post("/upload", upload.single("file"), asyncHandler(async (req, res) => {
  if (!req.file) throw new NotFoundError("No file uploaded");
  const buffer = fs.readFileSync(req.file.path);
  const documentHash = hashDocument(buffer);
  const documentUrl = `${env.storageUrl}/${req.file.filename}`;
  res.json({ documentUrl, documentHash, originalName: req.file.originalname });
}));

invoiceRouter.get("/", asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await listInvoices(req.user!));
}));

invoiceRouter.get("/:id", asyncHandler(async (req, res) => {
  const invoice = await Invoice.findOne(invoiceFilter(req.params.id)).populate("sellerCompany buyerCompany sellerId buyerId");
  if (!invoice) throw new NotFoundError();
  res.json(invoice);
}));

invoiceRouter.post("/:id/verify", authorize("msme", "admin"), asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await verifyInvoice(req.user!, req.params.id));
}));

invoiceRouter.post("/:id/blockchain", authorize("msme", "admin"), asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await registerOnChain(req.user!, req.params.id));
}));

invoiceRouter.post("/:id/accept", authorize("buyer", "admin"), asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await buyerDecision(req.user!, req.params.id, "accept"));
}));

invoiceRouter.post("/:id/reject", authorize("buyer", "admin"), asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await buyerDecision(req.user!, req.params.id, "reject", req.body?.reason));
}));

invoiceRouter.post("/:id/dispute", asyncHandler(async (req: AuthedRequest, res) => {
  const body = z.object({ reason: z.string(), description: z.string(), evidence: z.string().optional() }).parse(req.body);
  res.json(await raiseDispute(req.user!, req.params.id, body));
}));

invoiceRouter.post("/:id/delivery", authorize("buyer", "admin"), asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await confirmDelivery(req.user!, req.params.id));
}));

invoiceRouter.post("/:id/pay", authorize("buyer", "admin"), asyncHandler(async (req: AuthedRequest, res) => {
  const body = z.object({
    amount: z.coerce.number().positive(),
    paymentMethod: z.enum(["NEFT", "RTGS", "UPI", "CHEQUE", "OTHER"]),
    reference: z.string().min(3)
  }).parse(req.body);
  res.json(await markPaid(req.user!, req.params.id, body));
}));

invoiceRouter.post("/:id/finance", authorize("msme", "admin"), asyncHandler(async (req: AuthedRequest, res) => {
  const body = z.object({ requestedAmount: z.coerce.number().positive(), requestedTenure: z.coerce.number().int().positive() }).parse(req.body);
  res.json(await requestFinancing(req.user!, req.params.id, body));
}));

invoiceRouter.get("/:id/passport", asyncHandler(async (req, res) => {
  res.json(await getPassport(req.params.id));
}));

invoiceRouter.get("/:id/qr", asyncHandler(async (req, res) => {
  res.json(await qrPayload(req.params.id));
}));

invoiceRouter.get("/:id/blockchain", asyncHandler(async (req, res) => {
  const invoice = await Invoice.findOne({ publicId: req.params.id });
  if (!invoice) throw new NotFoundError();
  res.json(await readOnChain(invoice.publicId));
}));
