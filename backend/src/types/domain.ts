export const ROLES = ["msme", "buyer", "financier", "admin"] as const;
export type Role = (typeof ROLES)[number];

export const LIFECYCLE = [
  "DRAFT",
  "CREATED",
  "VERIFICATION_PENDING",
  "VERIFIED",
  "BUYER_PENDING",
  "ACCEPTED",
  "DELIVERY_VERIFIED",
  "FINANCING_AVAILABLE",
  "FINANCING_REQUESTED",
  "FINANCED",
  "PAYMENT_PENDING",
  "PAID",
  "DISPUTED",
  "REJECTED",
  "CANCELLED"
] as const;
export type LifecycleStatus = (typeof LIFECYCLE)[number];

export const DUPLICATE_LEVELS = ["SAFE", "POSSIBLE_DUPLICATE", "HIGH_RISK"] as const;
export type DuplicateLevel = (typeof DUPLICATE_LEVELS)[number];
