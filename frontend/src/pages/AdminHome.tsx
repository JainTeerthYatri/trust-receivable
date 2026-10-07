import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { toast } from "sonner";
import { api } from "../api";
import { inrCompact } from "../format";
import { ChartCard, Skeleton } from "./MsmeHome";
import { Badge, Kpi, TableWrap } from "./ui";

export function AdminHome() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["dash-admin"], queryFn: async () => (await api.get("/dashboard/admin")).data });
  const suspend = useMutation({
    mutationFn: (id: string) => api.post(`/admin/users/${id}/suspend`),
    onSuccess: () => {
      toast.success("Account suspended");
      qc.invalidateQueries({ queryKey: ["dash-admin"] });
    }
  });
  if (isLoading || !data) return <Skeleton />;
  const k = data.kpis;
  return (
    <div className="space-y-6">
      <h1 className="font-display text-4xl">Platform control tower</h1>
      <div className="grid gap-4 md:grid-cols-4 xl:grid-cols-7">
        <Kpi label="Users" value={String(k.users)} />
        <Kpi label="MSMEs" value={String(k.msmes)} />
        <Kpi label="Invoices" value={String(k.invoices)} />
        <Kpi label="Invoice value" value={inrCompact(k.invoiceValue)} />
        <Kpi label="Financed" value={inrCompact(k.financed)} />
        <Kpi label="Fraud alerts" value={String(k.fraudAlerts)} />
        <Kpi label="Open disputes" value={String(k.disputes)} />
      </div>
      <ChartCard title="Invoice value by month">
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={data.monthly}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="value" fill="#12263a" radius={6} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
      <TableWrap>
        <table className="w-full text-left text-sm">
          <thead className="border-b text-xs uppercase text-slate-500">
            <tr>
              <th className="p-3">User</th>
              <th>Role</th>
              <th>Email</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {data.users.map((u: any) => (
              <tr key={u._id} className="border-b">
                <td className="p-3">{u.name}</td>
                <td><Badge status={u.role}>{u.role}</Badge></td>
                <td>{u.email}</td>
                <td className="p-3">
                  {u.role !== "admin" ? (
                    <button className="text-rose-700" onClick={() => suspend.mutate(u._id)}>Suspend</button>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableWrap>
      <div className="rounded-2xl bg-white p-5 shadow-card">
        <h3 className="font-semibold">Audit log</h3>
        <ul className="mt-3 space-y-2 text-sm text-slate-600">
          {data.audits.map((a: any) => (
            <li key={a._id}>{a.action} · {a.entityType} · {a.entityId}</li>
          ))}
          {data.audits.length === 0 ? <li>No audit events yet in this session.</li> : null}
        </ul>
      </div>
    </div>
  );
}
