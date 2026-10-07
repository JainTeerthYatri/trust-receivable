import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { api } from "../api";
import { inr } from "../format";
import { Badge } from "./ui";
import { Skeleton } from "./MsmeHome";

export function Passport() {
  const { id } = useParams();
  const { data, isLoading } = useQuery({ queryKey: ["pass", id], queryFn: async () => (await api.get(`/invoices/${id}/passport`)).data });
  const qr = useQuery({ queryKey: ["qr", id], queryFn: async () => (await api.get(`/invoices/${id}/qr`)).data });
  if (isLoading || !data) return <Skeleton />;
  const inv = data.invoice;
  return (
    <div className="mx-auto max-w-3xl rounded-3xl bg-ink-950 p-8 text-white shadow-card">
      <p className="text-xs uppercase tracking-[0.25em] text-mint-400">Receivable Passport</p>
      <h1 className="mt-2 font-display text-5xl">{inv.invoiceNumber}</h1>
      <p className="mt-2 text-slate-300">{inr(inv.amount)} · {inv.sellerCompany?.businessName} → {inv.buyerCompany?.businessName}</p>
      <div className="mt-8 grid gap-3 md:grid-cols-2">
        {[
          ["Invoice ID", inv.publicId],
          ["Invoice date", new Date(inv.invoiceDate).toLocaleDateString("en-IN")],
          ["Due date", new Date(inv.dueDate).toLocaleDateString("en-IN")],
          ["Verification", inv.lifecycleStatus],
          ["Buyer acceptance", inv.buyerAcceptanceStatus],
          ["Delivery", inv.deliveryStatus],
          ["Duplicate check", inv.duplicateLevel],
          ["Dispute", inv.disputeStatus],
          ["Blockchain", inv.blockchainStatus],
          ["Transaction", inv.blockchainTxHash || "—"],
          ["Financing", inv.financingStatus],
          ["Payment", inv.paymentStatus]
        ].map(([k, v]) => (
          <div key={k} className="rounded-2xl bg-white/5 p-4">
            <p className="text-[11px] uppercase tracking-wide text-slate-400">{k}</p>
            <p className="mt-1 break-all text-sm">{String(v)}</p>
          </div>
        ))}
      </div>
      <div className="mt-6 rounded-2xl bg-mint-500 p-5 text-ink-950">
        <p className="text-xs uppercase tracking-wide">Receivable Trust Score</p>
        <p className="font-display text-5xl">{data.trust.score}/100</p>
        <p className="text-sm">{data.trust.category}</p>
        <ul className="mt-3 list-disc pl-5 text-sm">
          {data.trust.reasons.map((r: string) => <li key={r}>{r}</li>)}
        </ul>
        <p className="mt-3 text-xs">{data.trust.disclaimer}</p>
      </div>
      {qr.data?.dataUrl ? (
        <div className="mt-6 flex items-center gap-4">
          <img src={qr.data.dataUrl} alt="Verification QR" className="h-32 w-32 rounded-xl bg-white p-2" />
          <p className="text-sm text-slate-300">Scan to open the public verification page. No sensitive documents are exposed.</p>
        </div>
      ) : null}
      <div className="mt-6">
        <h2 className="font-semibold">Lifecycle</h2>
        <ol className="mt-3 space-y-2 text-sm text-slate-300">
          {inv.timeline?.map((t: any, i: number) => (
            <li key={i}><Badge status={t.status}>{t.status}</Badge> {t.note}</li>
          ))}
        </ol>
      </div>
    </div>
  );
}
