import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { toast } from "sonner";
import { api } from "../api";
import { useAuth } from "../auth";
import { inr } from "../format";
import { Badge } from "./ui";
import { Skeleton } from "./MsmeHome";
import { useState } from "react";

export function InvoiceDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [chain, setChain] = useState<any>(null);
  const { data, isLoading } = useQuery({ queryKey: ["inv", id], queryFn: async () => (await api.get(`/invoices/${id}`)).data });
  const run = useMutation({
    mutationFn: (path: string) =>
      path === "finance"
        ? api.post(`/invoices/${id}/finance`, { requestedAmount: Math.round((data?.amount || 0) * 0.8), requestedTenure: 60 })
        : api.post(`/invoices/${id}/${path}`),
    onSuccess: (res, path) => {
      if (path === "blockchain") {
        setChain(res.data.chain);
        toast[res.data.chain?.mode === "LIVE" ? "success" : "message"](
          res.data.chain?.mode === "LIVE" ? "Transaction confirmed on Hardhat" : "Labeled MOCK mode — Hardhat was not reachable"
        );
      } else toast.success("Updated");
      qc.invalidateQueries({ queryKey: ["inv", id] });
    },
    onError: (err: any) => toast.error(err.response?.data?.error || "Action failed")
  });

  if (isLoading || !data) return <Skeleton />;

  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <div className="rounded-3xl bg-white p-6 shadow-card">
        <p className="text-xs uppercase tracking-[0.18em] text-mint-600">{data.publicId}</p>
        <h1 className="font-display text-4xl">{data.invoiceNumber}</h1>
        <p className="mt-2 text-slate-600">{data.sellerCompany?.businessName} → {data.buyerCompany?.businessName}</p>
        <p className="mt-4 font-display text-3xl">{inr(data.amount)}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Badge status={data.lifecycleStatus}>{data.lifecycleStatus}</Badge>
          <Badge status={data.duplicateLevel}>{data.duplicateLevel}</Badge>
          <Badge status={data.blockchainStatus}>{data.blockchainStatus}</Badge>
        </div>
        <dl className="mt-6 grid gap-3 text-sm md:grid-cols-2">
          <div><dt className="text-slate-500">Invoice hash</dt><dd className="break-all font-mono text-xs">{data.invoiceHash}</dd></div>
          <div><dt className="text-slate-500">Trust score</dt><dd>{data.aiRiskScore}/100 · {data.fraudRiskLevel}</dd></div>
          <div><dt className="text-slate-500">Buyer acceptance</dt><dd>{data.buyerAcceptanceStatus}</dd></div>
          <div><dt className="text-slate-500">Delivery</dt><dd>{data.deliveryStatus}</dd></div>
        </dl>
        {data.duplicateNotes?.length ? (
          <ul className="mt-4 list-disc pl-5 text-sm text-slate-600">
            {data.duplicateNotes.map((n: string) => <li key={n}>{n}</li>)}
          </ul>
        ) : null}
        <div className="mt-6 flex flex-wrap gap-2">
          {user?.role === "msme" || user?.role === "admin" ? (
            <>
              <button className="rounded-full bg-ink-900 px-4 py-2 text-sm text-white" onClick={() => run.mutate("verify")}>Verify invoice</button>
              <button className="rounded-full bg-mint-600 px-4 py-2 text-sm text-white" onClick={() => run.mutate("blockchain")}>Register on blockchain</button>
              <button className="rounded-full border px-4 py-2 text-sm" onClick={() => run.mutate("finance")}>Request financing</button>
            </>
          ) : null}
          {user?.role === "buyer" || user?.role === "admin" ? (
            <>
              <button className="rounded-full border px-4 py-2 text-sm" onClick={() => run.mutate("accept")}>Accept</button>
              <button className="rounded-full border px-4 py-2 text-sm" onClick={() => run.mutate("delivery")}>Confirm delivery</button>
              <button className="rounded-full border px-4 py-2 text-sm" onClick={async () => {
                await api.post(`/invoices/${id}/pay`, { amount: data.amount, paymentMethod: "NEFT", reference: `NEFT-${data.invoiceNumber}` });
                toast.success("Payment recorded");
                qc.invalidateQueries({ queryKey: ["inv", id] });
              }}>Mark paid</button>
              <button className="rounded-full border px-4 py-2 text-sm" onClick={async () => {
                await api.post(`/invoices/${id}/dispute`, { reason: "Commercial dispute", description: "Raised from buyer workspace" });
                toast.message("Dispute opened");
                qc.invalidateQueries({ queryKey: ["inv", id] });
              }}>Dispute</button>
            </>
          ) : null}
          <Link className="rounded-full border px-4 py-2 text-sm" to={`/app/passport/${data.publicId}`}>View passport</Link>
          <Link className="rounded-full border px-4 py-2 text-sm" to={`/verify/${data.publicId}`}>Public QR page</Link>
        </div>
        {chain ? (
          <div className="mt-6 rounded-2xl bg-ink-950 p-4 text-sm text-white">
            <p className="text-mint-400">{chain.mode === "LIVE" ? "Transaction confirmed" : "Development mock mode"}</p>
            <p className="mt-2 break-all">Tx: {chain.transactionHash}</p>
            <p>Block: {chain.blockNumber}</p>
            <p>Contract: {chain.contractAddress}</p>
            <p>Network: {chain.network}</p>
            <p>Time: {chain.timestamp}</p>
          </div>
        ) : null}
      </div>
      <div className="rounded-3xl bg-white p-6 shadow-card">
        <h2 className="font-semibold">Lifecycle timeline</h2>
        <ol className="mt-4 space-y-3">
          {(data.timeline || []).map((t: any, i: number) => (
            <li key={i} className="border-l-2 border-mint-500 pl-3 text-sm">
              <p className="font-medium">{t.status}</p>
              <p className="text-slate-500">{t.note}</p>
              <p className="text-xs text-slate-400">{new Date(t.at).toLocaleString("en-IN")}</p>
            </li>
          ))}
        </ol>
        <h2 className="mt-8 font-semibold">Why this trust score</h2>
        <ul className="mt-2 list-disc pl-5 text-sm text-slate-600">
          {(data.trustReasons || []).map((r: string) => <li key={r}>{r}</li>)}
        </ul>
      </div>
    </div>
  );
}
