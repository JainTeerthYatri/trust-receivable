import { Navigate, Outlet } from "react-router-dom";
import { useAuth, type Role } from "./auth";

export function Protected({ roles }: { roles?: Role[] }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-10 text-sm text-slate-500">Loading session…</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/login" replace />;
  return <Outlet />;
}
