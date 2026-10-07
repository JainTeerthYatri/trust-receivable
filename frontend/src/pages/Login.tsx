import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "../auth";
import { dashboardPath } from "../format";

const schema = z.object({ email: z.string().email(), password: z.string().min(1) });

const demos = [
  ["MSME", "msme@demo.com"],
  ["Buyer", "buyer@demo.com"],
  ["Financier", "financier@demo.com"],
  ["Admin", "admin@demo.com"]
];

export function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const form = useForm({ resolver: zodResolver(schema), defaultValues: { email: "msme@demo.com", password: "Demo@12345" } });

  return (
    <div className="grid min-h-screen md:grid-cols-2">
      <div className="hidden bg-ink-950 p-12 text-white md:flex md:flex-col md:justify-between">
        <p className="text-sm tracking-[0.2em]">TRUSTRECEIVABLE</p>
        <div>
          <h1 className="font-display text-5xl">A trust layer for MSME invoices.</h1>
          <p className="mt-4 max-w-md text-slate-300">Demo password for all seeded accounts: Demo@12345</p>
        </div>
      </div>
      <div className="flex items-center justify-center p-8">
        <form
          className="w-full max-w-md space-y-4"
          onSubmit={form.handleSubmit(async (values) => {
            try {
              const user = await login(values.email, values.password);
              toast.success(`Signed in as ${user.role}`);
              nav(dashboardPath(user.role));
            } catch (err: unknown) {
              const message = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || "Login failed";
              toast.error(message);
            }
          })}
        >
          <h2 className="font-display text-3xl">Sign in</h2>
          <label className="block text-sm">Email
            <input className="mt-1 w-full rounded-xl border px-3 py-2" {...form.register("email")} />
          </label>
          <label className="block text-sm">Password
            <input type="password" className="mt-1 w-full rounded-xl border px-3 py-2" {...form.register("password")} />
          </label>
          <button className="w-full rounded-xl bg-ink-900 py-3 text-white">Continue</button>
          <div className="grid grid-cols-2 gap-2">
            {demos.map(([label, email]) => (
              <button
                type="button"
                key={email}
                className="rounded-xl border px-3 py-2 text-left text-xs"
                onClick={() => form.reset({ email, password: "Demo@12345" })}
              >
                {label}<br /><span className="text-slate-500">{email}</span>
              </button>
            ))}
          </div>
          <p className="text-sm text-slate-500">New organisation? <Link className="text-mint-600" to="/register">Register</Link></p>
        </form>
      </div>
    </div>
  );
}
