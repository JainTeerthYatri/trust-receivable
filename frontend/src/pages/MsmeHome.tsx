import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { api } from "../api";
import { inrCompact } from "../format";
import { Badge, Kpi, TableWrap } from "./ui";

export function MsmeHome() {
  const { data, isLoading } = useQuery({ queryKey: ["dash-msme"], queryFn: async () => (await api.get("/dashboard/msme")).data });
  if (isLoading || !data) return <Skeleton />;
  const k = data.kpis;
  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-mint-600">MSME workspace</p>
          <h1 className="font-display text-4xl">Receivables command</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link className="rounded-full bg-ink-900 px-4 py-2 text-sm text-white" to="/app/invoices/new">Create invoice</Link>
          <Link className="rounded-full border px-4 py-2 text-sm" to="/app/invoices">Request financing</Link>
        </div>
      </header>
      <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
        <Kpi label="Total receivables" value={inrCompact(k.totalReceivables)} />
        <Kpi label="Verified invoices" value={String(k.verifiedInvoices)} />
        <Kpi label="Pending payments" value={inrCompact(k.pendingPayments)} />
        <Kpi label="Financed" value={inrCompact(k.financed)} />
        <Kpi label="Available financing" value={inrCompact(k.availableFinancing)} />
        <Kpi label="Trust score" value={`${k.trustScore}/100`} hint="Receivable Trust Score (prototype)" />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Monthly receivables">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={data.monthly}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="receivables" fill="#0f766e" radius={6} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Paid vs unpaid">
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={data.paidVsUnpaid} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80}>
                {data.paidVsUnpaid.map((_: unknown, i: number) => (
                  <Cell key={i} fill={i === 0 ? "#14b8a6" : "#12263a"} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
      <TableWrap>
        <table className="w-full text-left text-sm">
          <thead className="border-b text-xs uppercase text-slate-500">
            <tr>
              <th className="p-3">Invoice</th>
              <th>Buyer</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Trust</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {data.invoices.slice(0, 8).map((inv: any) => (
              <tr key={inv._id} className="border-b last:border-0">
                <td className="p-3 font-medium">{inv.invoiceNumber}</td>
                <td>{inv.buyerCompany?.businessName}</td>
                <td>{inrCompact(inv.amount)}</td>
                <td><Badge status={inv.lifecycleStatus}>{inv.lifecycleStatus}</Badge></td>
                <td>{inv.aiRiskScore}</td>
                <td className="p-3"><Link className="text-mint-600" to={`/app/invoices/${inv.publicId}`}>Open</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableWrap>
    </div>
  );
}

export function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-card">
      <h3 className="mb-3 text-sm font-semibold">{title}</h3>
      {children}
    </div>
  );
}

export function Skeleton() {
  return <div className="h-40 animate-pulse rounded-2xl bg-white" />;
}
