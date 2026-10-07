import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "../auth";
import { dashboardPath } from "../format";

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  phone: z.string().min(10),
  role: z.enum(["msme", "buyer", "financier"]),
  legalName: z.string().min(2),
  businessName: z.string().min(2),
  GSTIN: z.string().min(10),
  UdyamNumber: z.string().optional(),
  PAN: z.string().min(8),
  address: z.string().min(4),
  city: z.string().min(2),
  state: z.string().min(2),
  industry: z.string().min(2)
});

export function Register() {
  const { register: signup } = useAuth();
  const nav = useNavigate();
  const form = useForm({ resolver: zodResolver(schema), defaultValues: { role: "msme" as const } });

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="font-display text-4xl">Register your organisation</h1>
      <p className="mt-2 text-sm text-slate-600">Admin accounts are seeded for the demo and are not self-serve.</p>
      <form
        className="mt-8 grid gap-4 md:grid-cols-2"
        onSubmit={form.handleSubmit(async (v) => {
          try {
            const user = await signup({
              name: v.name,
              email: v.email,
              password: v.password,
              phone: v.phone,
              role: v.role,
              company: {
                legalName: v.legalName,
                businessName: v.businessName,
                GSTIN: v.GSTIN,
                UdyamNumber: v.UdyamNumber,
                PAN: v.PAN,
                address: v.address,
                city: v.city,
                state: v.state,
                industry: v.industry
              }
            });
            toast.success("Workspace created");
            nav(dashboardPath(user.role));
          } catch (err: unknown) {
            toast.error((err as { response?: { data?: { error?: string } } })?.response?.data?.error || "Could not register");
          }
        })}
      >
        {([
          ["name", "Your name"],
          ["email", "Email"],
          ["password", "Password", "password"],
          ["phone", "Phone"],
          ["legalName", "Legal name"],
          ["businessName", "Business name"],
          ["GSTIN", "GSTIN"],
          ["UdyamNumber", "Udyam number"],
          ["PAN", "PAN"],
          ["address", "Address"],
          ["city", "City"],
          ["state", "State"],
          ["industry", "Industry"]
        ] as const).map(([name, label, type]) => (
          <label key={name} className="text-sm">
            {label}
            <input type={type || "text"} className="mt-1 w-full rounded-xl border px-3 py-2" {...form.register(name)} />
          </label>
        ))}
        <label className="text-sm">Role
          <select className="mt-1 w-full rounded-xl border px-3 py-2" {...form.register("role")}>
            <option value="msme">MSME / seller</option>
            <option value="buyer">Buyer</option>
            <option value="financier">Financier</option>
          </select>
        </label>
        <div className="md:col-span-2 flex gap-3">
          <button className="rounded-xl bg-ink-900 px-5 py-3 text-white">Create account</button>
          <Link to="/login" className="px-5 py-3 text-sm">Already registered</Link>
        </div>
      </form>
    </div>
  );
}
