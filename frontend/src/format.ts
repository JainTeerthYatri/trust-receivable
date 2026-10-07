export function inr(n: number | undefined) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n || 0);
}

export function inrCompact(n: number | undefined) {
  const v = n || 0;
  if (v >= 10_000_000) return `₹${(v / 10_000_000).toFixed(1)} Cr`;
  if (v >= 100_000) return `₹${(v / 100_000).toFixed(1)} Lakh`;
  return inr(v);
}

export function statusTone(status: string) {
  if (["PAID", "VERIFIED", "ACCEPTED", "SAFE", "FINANCED", "CONFIRMED"].includes(status)) return "bg-emerald-50 text-emerald-800";
  if (["DISPUTED", "HIGH_RISK", "REJECTED", "HIGH"].includes(status)) return "bg-rose-50 text-rose-800";
  if (["PENDING", "BUYER_PENDING", "REQUESTED", "MEDIUM"].includes(status)) return "bg-amber-50 text-amber-800";
  return "bg-slate-100 text-slate-700";
}

export function dashboardPath(role: string) {
  if (role === "buyer") return "/app/buyer";
  if (role === "financier") return "/app/financier";
  if (role === "admin") return "/app/admin";
  return "/app";
}
