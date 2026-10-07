import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { User } from "../models/User.js";
import { UnauthorizedError, ForbiddenError } from "../utils/errors.js";
import type { Role } from "../types/domain.js";

export type AuthedRequest = Request & {
  user?: { id: string; role: Role };
};

export async function authenticate(req: AuthedRequest, _res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) throw new UnauthorizedError();
    const token = header.slice(7);
    const payload = jwt.verify(token, env.jwtSecret) as { sub: string; role: Role };
    const user = await User.findById(payload.sub);
    if (!user || user.isSuspended) throw new UnauthorizedError("Account is not active");
    req.user = { id: String(user._id), role: user.role as Role };
    next();
  } catch (err) {
    next(err instanceof UnauthorizedError ? err : new UnauthorizedError());
  }
}

export function authorize(...roles: Role[]) {
  return (req: AuthedRequest, _res: Response, next: NextFunction) => {
    if (!req.user) return next(new UnauthorizedError());
    if (!roles.includes(req.user.role)) return next(new ForbiddenError());
    next();
  };
}
