import { Link, Navigate, Route, Routes } from "react-router-dom";
import { Protected } from "./Protected";
import { useAuth } from "./auth";
import { dashboardPath } from "./format";
import { Landing } from "./pages/Landing";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { Shell } from "./pages/Shell";
import { MsmeHome } from "./pages/MsmeHome";
import { BuyerHome } from "./pages/BuyerHome";
import { FinancierHome } from "./pages/FinancierHome";
import { AdminHome } from "./pages/AdminHome";
import { InvoiceCreate } from "./pages/InvoiceCreate";
import { InvoiceDetail } from "./pages/InvoiceDetail";
import { Passport } from "./pages/Passport";
import { PublicVerify } from "./pages/PublicVerify";
import { Invoices } from "./pages/Invoices";
import { Notifications } from "./pages/Notifications";

export default function App() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={user ? <Navigate to={dashboardPath(user.role)} /> : <Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/verify/:invoiceId" element={<PublicVerify />} />
      <Route element={<Protected />}>
        <Route path="/app" element={<Shell />}>
          <Route index element={<MsmeHome />} />
          <Route path="buyer" element={<BuyerHome />} />
          <Route path="financier" element={<FinancierHome />} />
          <Route path="admin" element={<AdminHome />} />
          <Route path="invoices" element={<Invoices />} />
          <Route path="invoices/new" element={<InvoiceCreate />} />
          <Route path="invoices/:id" element={<InvoiceDetail />} />
          <Route path="passport/:id" element={<Passport />} />
          <Route path="notifications" element={<Notifications />} />
        </Route>
      </Route>
      <Route path="*" element={<div className="p-10">Page not found. <Link to="/" className="text-mint-600">Home</Link></div>} />
    </Routes>
  );
}
