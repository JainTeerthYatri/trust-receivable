import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../api";
import { Skeleton } from "./MsmeHome";

export function Notifications() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["notes"], queryFn: async () => (await api.get("/notifications")).data });
  const read = useMutation({
    mutationFn: (id: string) => api.post(`/notifications/${id}/read`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notes"] })
  });
  if (isLoading || !data) return <Skeleton />;
  if (data.length === 0) return <div className="rounded-2xl bg-white p-10 text-center">No notifications yet.</div>;
  return (
    <div className="space-y-3">
      <h1 className="font-display text-4xl">Notifications</h1>
      {data.map((n: any) => (
        <button key={n._id} className={`block w-full rounded-2xl p-4 text-left shadow-card ${n.read ? "bg-white" : "bg-mint-50"}`} onClick={() => read.mutate(n._id)}>
          <p className="font-semibold">{n.title}</p>
          <p className="text-sm text-slate-600">{n.message}</p>
        </button>
      ))}
    </div>
  );
}
