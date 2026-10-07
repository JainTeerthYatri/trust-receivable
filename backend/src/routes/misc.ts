import { Router } from "express";
import { authenticate, authorize, type AuthedRequest } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { adminDashboard, buyerDashboard, financierDashboard, msmeDashboard } from "../services/dashboardService.js";
import { Notification } from "../models/Notification.js";
import { User } from "../models/User.js";
import { publicVerify } from "../services/invoiceService.js";
import { blockchainStatus } from "../blockchain/service.js";

export const dashboardRouter = Router();
dashboardRouter.use(authenticate);

dashboardRouter.get("/msme", authorize("msme", "admin"), asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await msmeDashboard(req.user!.id));
}));

dashboardRouter.get("/buyer", authorize("buyer", "admin"), asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await buyerDashboard(req.user!.id));
}));

dashboardRouter.get("/financier", authorize("financier", "admin"), asyncHandler(async (_req, res) => {
  res.json(await financierDashboard());
}));

dashboardRouter.get("/admin", authorize("admin"), asyncHandler(async (_req, res) => {
  res.json(await adminDashboard());
}));

export const notificationRouter = Router();
notificationRouter.use(authenticate);
notificationRouter.get("/", asyncHandler(async (req: AuthedRequest, res) => {
  const rows = await Notification.find({ userId: req.user!.id }).sort({ createdAt: -1 }).limit(50);
  res.json(rows);
}));
notificationRouter.post("/:id/read", asyncHandler(async (req: AuthedRequest, res) => {
  await Notification.findOneAndUpdate({ _id: req.params.id, userId: req.user!.id }, { read: true });
  res.json({ ok: true });
}));

export const adminRouter = Router();
adminRouter.use(authenticate, authorize("admin"));
adminRouter.post("/users/:id/suspend", asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(req.params.id, { isSuspended: true }, { new: true });
  res.json({ id: user?._id, isSuspended: true });
}));

export const publicRouter = Router();
publicRouter.get("/verify/:invoiceId", asyncHandler(async (req, res) => {
  res.json(await publicVerify(req.params.invoiceId));
}));
publicRouter.get("/health", asyncHandler(async (_req, res) => {
  res.json({ ok: true, service: "trustreceivable", blockchain: blockchainStatus() });
}));
