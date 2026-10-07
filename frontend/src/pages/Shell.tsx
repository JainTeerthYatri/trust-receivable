import { Bell, Landmark, LayoutDashboard, LogOut, Receipt, Shield } from "lucide-react";
import { Navigate, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth";
import { dashboardPath } from "../format";

const links = {
  msme: [
    ["/app", "Dashboard", LayoutDashboard],
    ["/app/invoices", "Invoices", Receipt],
    ["/app/invoices/new", "Create invoice", Receipt],
    ["/app/notifications", "Notifications", Bell]
  ],
  buyer: [
    ["/app/buyer", "Dashboard", LayoutDashboard],
    ["/app/invoices", "Payables", Receipt],
    ["/app/notifications", "Notifications", Bell]
  ],
  financier: [
    ["/app/financier", "Underwriting", Landmark],
    ["/app/invoices", "Receivables", Receipt],
    ["/app/notifications", "Notifications", Bell]
  ],
  admin: [
    ["/app/admin", "Control tower", Shield],
    ["/app/invoices", "All invoices", Receipt],
    ["/app/notifications", "Notifications", Bell]
  ]
} as const;

export function Shell() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const items = links[user?.role || "msme"];
  if (user && loc.pathname === "/app" && user.role !== "msme" && user.role !== "admin") {
    return <Navigate to={dashboardPath(user.role)} replace />;
  }
  return (
    <div className="min-h-screen md:grid md:grid-cols-[260px_1fr]">
      <aside className="bg-ink-950 p-5 text-white">
        <p className="text-xs tracking-[0.22em] text-mint-400">TRUSTRECEIVABLE</p>
        <p className="mt-2 font-display text-2xl">Workspace</p>
        <p className="mt-1 text-xs text-slate-400">{user?.name} · {user?.role}</p>
        <nav className="mt-8 space-y-1">
          {items.map(([to, label, Icon]) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/app"}
              className={({ isActive }) => `flex items-center gap-2 rounded-xl px-3 py-2 text-sm ${isActive ? "bg-white/10" : "text-slate-300 hover:bg-white/5"}`}
            >
              <Icon className="h-4 w-4" /> {label}
            </NavLink>
          ))}
        </nav>
        <button
          className="mt-10 flex items-center gap-2 text-sm text-slate-400"
          onClick={() => {
            logout();
            nav("/");
          }}
        >
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </aside>
      <main className="min-h-screen bg-sand-50 p-4 md:p-8">
        <Outlet />
      </main>
    </div>
  );
}
