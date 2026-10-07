import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api } from "../api";
import { inrCompact } from "../format";
import { Badge, TableWrap } from "./ui";
import { Skeleton } from "./MsmeHome";

export function Invoices() {
  const { data, isLoading } = useQuery({ queryKey: ["invoices"], queryFn: async () => (await api.get("/invoices")).data });
  if (isLoading || !data) return <Skeleton />;
  if (data.length === 0) {
    return (
      <div className="rounded-3xl bg-white p-10 text-center shadow-card">
        <h1 className="font-display text-3xl">No invoices yet</h1>
        <p className="mt-2 text-slate-600">Create a receivable to start verification.</p>
        <Link className="mt-4 inline-block rounded-full bg-ink-900 px-4 py-2 text-white" to="/app/invoices/new">Create invoice</Link>
      </div>
    );
  }
  return (
    <div>
      <h1 className="mb-4 font-display text-4xl">Invoices</h1>
      <TableWrap>
        <table className="w-full text-left text-sm">
          <thead className="border-b text-xs uppercase text-slate-500">
            <tr>
              <th className="p-3">Number</th>
              <th>Parties</th>
              <th>Amount</th>
              <th>Lifecycle</th>
              <th>Trust</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {data.map((inv: any) => (
              <tr key={inv._id} className="border-b last:border-0">
                <td className="p-3 font-medium">{inv.invoiceNumber}</td>
                <td>{inv.sellerCompany?.businessName} → {inv.buyerCompany?.businessName}</td>
                <td>{inrCompact(inv.amount)}</td>
                <td><Badge status={inv.lifecycleStatus}>{inv.lifecycleStatus}</Badge></td>
                <td>{inv.aiRiskScore}</td>
                <td className="p-3 space-x-3">
                  <Link className="text-mint-700" to={`/app/invoices/${inv.publicId}`}>Open</Link>
                  <Link className="text-slate-500" to={`/app/passport/${inv.publicId}`}>Passport</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableWrap>
    </div>
  );
}
