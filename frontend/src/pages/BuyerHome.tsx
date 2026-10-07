import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "../api";
import { inrCompact } from "../format";
import { Badge, Kpi, TableWrap } from "./ui";
import { Skeleton } from "./MsmeHome";
import { Link } from "react-router-dom";

export function BuyerHome() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["dash-buyer"], queryFn: async () => (await api.get("/dashboard/buyer")).data });
  const act = useMutation({
    mutationFn: async ({ id, path }: { id: string; path: string }) => api.post(`/invoices/${id}/${path}`),
    onSuccess: () => {
      toast.success("Updated");
      qc.invalidateQueries({ queryKey: ["dash-buyer"] });
    }
  });
  if (isLoading || !data) return <Skeleton />;
  return (
    <div className="space-y-6">
      <h1 className="font-display text-4xl">Buyer payables</h1>
      <div className="grid gap-4 md:grid-cols-5">
        <Kpi label="Pending invoices" value={String(data.kpis.pending)} />
        <Kpi label="Accepted" value={String(data.kpis.accepted)} />
        <Kpi label="Disputed" value={String(data.kpis.disputed)} />
        <Kpi label="Total payable" value={inrCompact(data.kpis.totalPayable)} />
        <Kpi label="Upcoming payments" value={String(data.kpis.upcoming)} />
      </div>
      <TableWrap>
        <table className="w-full text-left text-sm">
          <thead className="border-b text-xs uppercase text-slate-500">
            <tr>
              <th className="p-3">Invoice</th>
              <th>Seller</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.invoices.map((inv: any) => (
              <tr key={inv._id} className="border-b last:border-0">
                <td className="p-3"><Link className="font-medium text-mint-700" to={`/app/invoices/${inv.publicId}`}>{inv.invoiceNumber}</Link></td>
                <td>{inv.sellerCompany?.businessName}</td>
                <td>{inrCompact(inv.amount)}</td>
                <td><Badge status={inv.lifecycleStatus}>{inv.lifecycleStatus}</Badge></td>
                <td className="space-x-1 p-3">
                  <Btn onClick={() => act.mutate({ id: inv.publicId, path: "accept" })}>Accept</Btn>
                  <Btn onClick={() => act.mutate({ id: inv.publicId, path: "reject" })}>Reject</Btn>
                  <Btn onClick={() => act.mutate({ id: inv.publicId, path: "delivery" })}>Confirm delivery</Btn>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableWrap>
    </div>
  );
}

function Btn({ children, onClick }: { children: string; onClick: () => void }) {
  return (
    <button className="mb-1 rounded-lg border px-2 py-1 text-[11px] uppercase" onClick={onClick}>
      {children}
    </button>
  );
}
