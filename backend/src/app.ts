import express from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import path from "path";
import { env } from "./config/env.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { authRouter } from "./routes/auth.js";
import { companyRouter } from "./routes/companies.js";
import { invoiceRouter } from "./routes/invoices.js";
import { financingRouter } from "./routes/financing.js";
import { adminRouter, dashboardRouter, notificationRouter, publicRouter } from "./routes/misc.js";

export function createApp() {
  const app = express();
  app.set("trust proxy", 1);
  app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
  app.use(cors({ origin: env.frontendUrl, credentials: true }));
  app.use(express.json({ limit: "1mb" }));
  app.use(morgan(env.nodeEnv === "production" ? "combined" : "dev"));
  app.use("/api", rateLimit({ windowMs: 60_000, max: 200, standardHeaders: true }));
  app.use("/uploads", express.static(path.resolve(env.storageDir)));

  app.use("/api/auth", authRouter);
  app.use("/api/users", authRouter);
  app.use("/api/companies", companyRouter);
  app.use("/api/invoices", invoiceRouter);
  app.use("/api/financing", financingRouter);
  app.use("/api/dashboard", dashboardRouter);
  app.use("/api/notifications", notificationRouter);
  app.use("/api/admin", adminRouter);
  app.use("/api", publicRouter);

  app.use(errorHandler);
  return app;
}
