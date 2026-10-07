import { useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { api } from "../api";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const schema = z.object({
  invoiceNumber: z.string().min(3),
  buyerId: z.string().min(1),
  amount: z.coerce.number().positive(),
  invoiceDate: z.string(),
  dueDate: z.string(),
  purchaseOrderNumber: z.string().optional(),
  description: z.string().min(4)
});

export function InvoiceCreate() {
  const nav = useNavigate();
  const buyers = useQuery({ queryKey: ["buyers"], queryFn: async () => (await api.get("/companies/buyers")).data });
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      invoiceNumber: "INV-DEMO-1000000",
      amount: 1000000,
      invoiceDate: new Date().toISOString().slice(0, 10),
      dueDate: new Date(Date.now() + 45 * 86400000).toISOString().slice(0, 10),
      purchaseOrderNumber: "PO-XYZ-9001",
      description: "Supply of precision components against buyer PO"
    }
  });

  return (
    <div className="mx-auto max-w-2xl rounded-3xl bg-white p-8 shadow-card">
      <h1 className="font-display text-3xl">Create invoice</h1>
      <p className="mt-2 text-sm text-slate-600">A SHA-256 fingerprint is generated from canonical commercial fields. The PDF never goes on-chain.</p>
      <form
        className="mt-6 space-y-4"
        onSubmit={form.handleSubmit(async (values) => {
          try {
            const res = await api.post("/invoices", values);
            toast.success("Invoice fingerprinted");
            nav(`/app/invoices/${res.data.publicId}`);
          } catch (err: unknown) {
            toast.error((err as { response?: { data?: { error?: string } } })?.response?.data?.error || "Could not create invoice");
          }
        })}
      >
        <label className="block text-sm">Invoice number
          <input className="mt-1 w-full rounded-xl border px-3 py-2" {...form.register("invoiceNumber")} />
        </label>
        <label className="block text-sm">Buyer
          <select className="mt-1 w-full rounded-xl border px-3 py-2" {...form.register("buyerId")}>
            <option value="">Select buyer</option>
            {(buyers.data || []).map((b: any) => (
              <option key={b.id} value={b.id}>{b.company?.businessName} · {b.email}</option>
            ))}
          </select>
        </label>
        <label className="block text-sm">Amount (INR)
          <input type="number" className="mt-1 w-full rounded-xl border px-3 py-2" {...form.register("amount")} />
        </label>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-sm">Invoice date
            <input type="date" className="mt-1 w-full rounded-xl border px-3 py-2" {...form.register("invoiceDate")} />
          </label>
          <label className="text-sm">Due date
            <input type="date" className="mt-1 w-full rounded-xl border px-3 py-2" {...form.register("dueDate")} />
          </label>
        </div>
        <label className="block text-sm">Purchase order
          <input className="mt-1 w-full rounded-xl border px-3 py-2" {...form.register("purchaseOrderNumber")} />
        </label>
        <label className="block text-sm">Description
          <textarea className="mt-1 w-full rounded-xl border px-3 py-2" rows={3} {...form.register("description")} />
        </label>
        <label className="block text-sm">Upload PDF / image (optional)
          <input
            type="file"
            accept="application/pdf,image/*"
            className="mt-1 block w-full text-sm"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const fd = new FormData();
              fd.append("file", file);
              const res = await api.post("/invoices/upload", fd);
              toast.success(`Document hash ${res.data.documentHash.slice(0, 12)}…`);
            }}
          />
        </label>
        <button className="rounded-xl bg-ink-900 px-5 py-3 text-white">Create and fingerprint</button>
      </form>
    </div>
  );
}
