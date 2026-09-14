import { useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
  Outlet,
} from "react-router-dom";
import type { UserSession } from "./types/attendance";
import ProtectedRoute from "./components/ProtectedRoute";
import { AdminDashboard } from "./components/AdminDashboard";
import AdminAttendanceDashboard from "./components/AdminAttendanceDashboard";
import { QRScannerView } from "./components/QRScannerView";
import SidebarLayout from "./components/NavBar";
import PrintableQRCard from "./components/PrintableQRCard";
import { AdminDependencias } from "./components/AdminDependencias";
import DirectAttendanceHandler from "./components/DirectAttendanceHandler";

// Componente Layout para envolver las páginas administrativas con el Sidebar
function AdminLayout({
  user,
  onLogout,
}: {
  user: UserSession | null;
  onLogout: () => void;
}) {
  return (
    <SidebarLayout user={user} onLogout={onLogout}>
      {/* Outlet renderiza la sub-ruta activa (/admin/dashboard, /admin/dependencias, etc.) */}
      <Outlet />
    </SidebarLayout>
  );
}

function AppRoutes({
  user,
  setUser,
}: {
  user: UserSession | null;
  setUser: (u: UserSession | null) => void;
}) {
  const navigate = useNavigate();

  const handleLogoutAndRedirect = () => {
    localStorage.removeItem("user_session");
    setUser(null);
    navigate("/login", { replace: true });
  };

  return (
    <Routes>
      {/* Ruta de Login */}
      <Route
        path="/login"
        element={
          <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
            <div className="bg-white p-8 rounded-2xl shadow-lg text-center max-w-sm w-full space-y-3">
              <h1 className="text-xl font-bold text-slate-800">
                Prueba de Roles
              </h1>
              <button
                onClick={() => {
                  const adminSession: UserSession = {
                    id: "1",
                    name: "Admin",
                    token: "xyz",
                    role: "admin",
                  };
                  localStorage.setItem(
                    "user_session",
                    JSON.stringify(adminSession),
                  );
                  setUser(adminSession);
                  navigate("/admin/dashboard", { replace: true });
                }}
                className="w-full bg-indigo-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
              >
                Superusuario
              </button>
              <button
                onClick={() => {
                  const empleadoSession: UserSession = {
                    id: "2",
                    name: "Empleado",
                    token: "xyz",
                    role: "empleado",
                  };
                  localStorage.setItem(
                    "user_session",
                    JSON.stringify(empleadoSession),
                  );
                  setUser(empleadoSession);
                  navigate("/scan", { replace: true });
                }}
                className="w-full bg-slate-800 text-white py-2 rounded-lg text-sm font-medium hover:bg-slate-900 transition-colors"
              >
                Empleado
              </button>
            </div>
          </div>
        }
      />

      {/* Ruta receptora del escaneo directo del teléfono */}
      <Route path="/marcar" element={<DirectAttendanceHandler user={user} />} />

      {/* Vista del Escáner (Empleado) */}
      <Route
        path="/scan"
        element={
          <ProtectedRoute user={user} allowedRoles={["empleado", "admin"]}>
            <QRScannerView onNavigateToLogin={handleLogoutAndRedirect} />
          </ProtectedRoute>
        }
      />

      {/* RUTA PROTEGIDA DE ADMINISTRACIÓN (Con Layout Anidado) */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute user={user} allowedRoles={["admin"]}>
            <AdminLayout user={user} onLogout={handleLogoutAndRedirect} />
          </ProtectedRoute>
        }
      >
        {/* Redirección automática de /admin a /admin/dashboard */}
        <Route index element={<Navigate to="/admin/dashboard" replace />} />

        {/* Sub-rutas administrativas */}
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="asistencias" element={<AdminAttendanceDashboard />} />

        {/* Aquí puedes seguir añadiendo más sub-rutas fácilmente: */}
        <Route path="dependencias" element={<AdminDependencias />} />
        <Route path="qr-cards" element={<PrintableQRCard />} />
        {/* <Route path="configuracion" element={<AdminConfiguracion />} /> */}
      </Route>

      {/* Catch-all Redirect */}
      <Route
        path="*"
        element={
          user ? (
            <Navigate
              to={user.role === "admin" ? "/admin/dashboard" : "/scan"}
              replace
            />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
    </Routes>
  );
}

export default function App() {
  const [user, setUser] = useState<UserSession | null>(() => {
    const saved = localStorage.getItem("user_session");
    if (!saved) return null;
    try {
      return JSON.parse(saved);
    } catch {
      return null;
    }
  });

  return (
    <BrowserRouter>
      <AppRoutes user={user} setUser={setUser} />
    </BrowserRouter>
  );
}
