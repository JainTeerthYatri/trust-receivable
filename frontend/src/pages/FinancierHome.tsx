import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Pie, PieChart, ResponsiveContainer, Tooltip, Cell } from "recharts";
import { toast } from "sonner";
import { api } from "../api";
import { inrCompact } from "../format";
import { ChartCard, Skeleton } from "./MsmeHome";
import { Badge, Kpi, TableWrap } from "./ui";

export function FinancierHome() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["dash-fin"], queryFn: async () => (await api.get("/dashboard/financier")).data });
  const decide = useMutation({
    mutationFn: async ({ id, path }: { id: string; path: string }) => api.post(`/financing/${id}/${path}`, { interestRate: 13.5 }),
    onSuccess: () => {
      toast.success("Decision recorded");
      qc.invalidateQueries({ queryKey: ["dash-fin"] });
    }
  });
  if (isLoading || !data) return <Skeleton />;
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.18em] text-mint-600">Financier workspace</p>
        <h1 className="font-display text-4xl">Inspect before you decide</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600">Decisions here are demonstration records. TrustReceivable is not a lender and does not disburse funds.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        <Kpi label="Financing requests" value={String(data.kpis.requests)} />
        <Kpi label="Approved volume" value={inrCompact(data.kpis.volume)} />
        <Kpi label="Approved" value={String(data.kpis.approved)} />
        <Kpi label="Pending applications" value={String(data.kpis.pending)} />
      </div>
      <ChartCard title="Risk distribution">
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie data={data.risk} dataKey="value" nameKey="name" outerRadius={80}>
              {data.risk.map((_: unknown, i: number) => (
                <Cell key={i} fill={["#14b8a6", "#3ee0c4", "#d4b36a", "#e11d48"][i]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </ChartCard>
      <TableWrap>
        <table className="w-full text-left text-sm">
          <thead className="border-b text-xs uppercase text-slate-500">
            <tr>
              <th className="p-3">Seller</th>
              <th>Invoice</th>
              <th>Amount</th>
              <th>Trust</th>
              <th>Chain</th>
              <th>Acceptance</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {data.requests.map((r: any) => {
              const inv = r.invoiceId;
              return (
                <tr key={r._id} className="border-b last:border-0">
                  <td className="p-3">{inv?.sellerCompany?.businessName}</td>
                  <td>{inv?.invoiceNumber}</td>
                  <td>{inrCompact(r.requestedAmount)}</td>
                  <td>{inv?.aiRiskScore}</td>
                  <td><Badge status={inv?.blockchainStatus}>{inv?.blockchainStatus}</Badge></td>
                  <td>{inv?.buyerAcceptanceStatus}</td>
                  <td className="space-x-1 p-3">
                    <Link className="text-mint-700" to={`/app/passport/${inv?.publicId}`}>Passport</Link>
                    <button className="rounded-lg border px-2 py-1 text-[11px]" onClick={() => decide.mutate({ id: r._id, path: "approve" })}>Approve</button>
                    <button className="rounded-lg border px-2 py-1 text-[11px]" onClick={() => decide.mutate({ id: r._id, path: "reject" })}>Reject</button>
                    <button className="rounded-lg border px-2 py-1 text-[11px]" onClick={() => decide.mutate({ id: r._id, path: "offer" })}>Offer</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </TableWrap>
    </div>
  );
}
