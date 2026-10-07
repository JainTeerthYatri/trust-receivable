import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { api } from "./api";

export type Role = "msme" | "buyer" | "financier" | "admin";
export type SessionUser = { id: string; name: string; email: string; role: Role; companyId: string | null };

type AuthState = {
  user: SessionUser | null;
  company: Record<string, unknown> | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<SessionUser>;
  register: (payload: Record<string, unknown>) => Promise<SessionUser>;
  logout: () => void;
};

const Ctx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [company, setCompany] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("tr_token");
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .get("/auth/me")
      .then((res) => {
        setUser(res.data.user);
        setCompany(res.data.company);
      })
      .catch(() => localStorage.removeItem("tr_token"))
      .finally(() => setLoading(false));
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      user,
      company,
      loading,
      login: async (email, password) => {
        const res = await api.post("/auth/login", { email, password });
        localStorage.setItem("tr_token", res.data.token);
        setUser(res.data.user);
        setCompany(res.data.company);
        return res.data.user as SessionUser;
      },
      register: async (payload) => {
        const res = await api.post("/auth/register", payload);
        localStorage.setItem("tr_token", res.data.token);
        setUser(res.data.user);
        setCompany(res.data.company);
        return res.data.user as SessionUser;
      },
      logout: () => {
        localStorage.removeItem("tr_token");
        setUser(null);
        setCompany(null);
      }
    }),
    [user, company, loading]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("AuthProvider missing");
  return ctx;
}
