import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import axios from "axios";

export function PublicVerify() {
  const { invoiceId } = useParams();
  const { data, isLoading, error } = useQuery({
    queryKey: ["public", invoiceId],
    queryFn: async () => (await axios.get(`/api/verify/${invoiceId}`)).data
  });
  if (isLoading) return <div className="p-10">Checking proof…</div>;
  if (error) return <div className="p-10">Verification record not found.</div>;
  return (
    <div className="min-h-screen bg-ink-950 px-6 py-16 text-white">
      <div className="mx-auto max-w-xl rounded-3xl border border-white/10 p-8">
        <p className="text-xs uppercase tracking-[0.25em] text-mint-400">TrustReceivable verification</p>
        <h1 className="mt-3 font-display text-4xl">{data.invoice}</h1>
        <p className="mt-1 text-slate-400">{data.publicId}</p>
        <dl className="mt-8 space-y-3 text-sm">
          <Row k="Status" v={data.status} />
          <Row k="Blockchain" v={data.blockchain} />
          <Row k="Buyer acceptance" v={data.buyerAcceptance} />
          <Row k="Delivery" v={data.delivery} />
          <Row k="Duplicate" v={data.duplicate} />
          <Row k="Trust score" v={String(data.trustScore)} />
          <Row k="Transaction" v={data.transactionHash || "Not registered"} />
        </dl>
        <p className="mt-8 text-xs text-slate-400">{data.disclaimer}</p>
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-white/10 py-2">
      <span className="text-slate-400">{k}</span>
      <span className="text-right font-medium">{v}</span>
    </div>
  );
}
