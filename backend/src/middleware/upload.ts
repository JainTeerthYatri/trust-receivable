import multer from "multer";
import path from "path";
import fs from "fs";
import { env } from "../config/env.js";
import { AppError } from "../utils/errors.js";

const dest = path.resolve(env.storageDir);
fs.mkdirSync(dest, { recursive: true });

const allowed = new Set(["application/pdf", "image/png", "image/jpeg", "image/webp"]);

export const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, dest),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `${Date.now()}-${Math.random().toString(16).slice(2)}${ext}`);
    }
  }),
  limits: { fileSize: env.maxUploadMb * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!allowed.has(file.mimetype)) {
      cb(new AppError("Only PDF or image invoices can be uploaded"));
      return;
    }
    cb(null, true);
  }
});
