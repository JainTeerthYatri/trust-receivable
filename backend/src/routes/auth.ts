import { Router } from "express";
import { loginSchema, loginUser, registerSchema, registerUser, sanitize } from "../services/authService.js";
import { User } from "../models/User.js";
import { Company } from "../models/Company.js";
import { authenticate, type AuthedRequest } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

export const authRouter = Router();

authRouter.post("/register", asyncHandler(async (req, res) => {
  const body = registerSchema.parse(req.body);
  const result = await registerUser(body);
  res.status(201).json(result);
}));

authRouter.post("/login", asyncHandler(async (req, res) => {
  const body = loginSchema.parse(req.body);
  const result = await loginUser(body);
  res.json(result);
}));

authRouter.get("/me", authenticate, asyncHandler(async (req: AuthedRequest, res) => {
  const user = await User.findById(req.user!.id);
  const company = user?.companyId ? await Company.findById(user.companyId) : null;
  res.json({ user: user ? sanitize(user) : null, company });
}));
