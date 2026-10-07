import { createHash } from "crypto";

export type CanonicalInvoice = {
  invoiceNumber: string;
  seller: string;
  buyer: string;
  amount: number;
  invoiceDate: string;
  purchaseOrder: string;
  dueDate: string;
};

export function normalizeText(value: string) {
  return value.trim().toUpperCase().replace(/\s+/g, " ");
}

export function toCanonicalInvoice(input: CanonicalInvoice): CanonicalInvoice {
  return {
    invoiceNumber: normalizeText(input.invoiceNumber),
    seller: normalizeText(input.seller),
    buyer: normalizeText(input.buyer),
    amount: Number(Number(input.amount).toFixed(2)),
    invoiceDate: input.invoiceDate.slice(0, 10),
    purchaseOrder: normalizeText(input.purchaseOrder || ""),
    dueDate: input.dueDate.slice(0, 10)
  };
}

export function sha256Json(value: unknown) {
  const json = JSON.stringify(value);
  return createHash("sha256").update(json).digest("hex");
}

export function fingerprintInvoice(input: CanonicalInvoice) {
  const canonical = toCanonicalInvoice(input);
  return { canonical, invoiceHash: sha256Json(canonical) };
}

export function hashDocument(buffer: Buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}
