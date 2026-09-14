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
import Login from "./components/Login";
import { Trash2 } from "lucide-react";

// Layout para sub-rutas administrativas
function AdminLayout({
  user,
  onLogout,
}: {
  user: UserSession | null;
  onLogout: () => void;
}) {
  return (
    <SidebarLayout user={user} onLogout={onLogout}>
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
    localStorage.removeItem("pending_qr_token");
    setUser(null);
    navigate("/login", { replace: true });
  };

  return (
    <Routes>
      {/* RUTA LOGIN */}
      <Route
        path="/login"
        element={
          <Login
            onLoginSuccess={(session) => {
              localStorage.setItem("user_session", JSON.stringify(session));
              setUser(session);
            }}
          />
        }
      />

      {/* RUTA DE PRUEBA DE ROLES */}
      <Route
        path="/test"
        element={
          <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
            <div className="bg-slate-800 border border-slate-700 p-8 rounded-3xl shadow-2xl text-center max-w-sm w-full space-y-4">
              <h1 className="text-xl font-bold text-white">
                Selector de Roles (Test)
              </h1>
              <p className="text-xs text-slate-400">
                Selecciona una sesión para simular la persistencia
              </p>
              <button
                onClick={() => {
                  const adminSession: UserSession = {
                    id: "usr_admin_01",
                    email: "admin@test.com",
                    role: "admin",
                    name: "Superusuario Admin",
                  };
                  localStorage.setItem("user_session", JSON.stringify(adminSession));
                  setUser(adminSession);
                  navigate("/admin/dashboard", { replace: true });
                }}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-xl text-xs font-semibold transition-all"
              >
                Ingresar como Superusuario
              </button>

              <button
                onClick={() => {
                  const empleadoSession: UserSession = {
                    id: "usr_emp_01",
                    email: "empleado@test.com",
                    role: "empleado",
                    name: "Juan Pérez",
                  };
                  localStorage.setItem("user_session", JSON.stringify(empleadoSession));
                  setUser(empleadoSession);
                  navigate("/scan", { replace: true });
                }}
                className="w-full bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-xl text-xs font-semibold transition-all"
              >
                Ingresar como Empleado
              </button>
            </div>
          </div>
        }
      />

      {/* RECEPTOR DE ESCANEO DE QR DERECHO */}
      <Route path="/marcar" element={<DirectAttendanceHandler user={user} />} />

      {/* VISTA ESCÁNER DE CAMARA (EMPLEADO) */}
      <Route
        path="/scan"
        element={
          <ProtectedRoute user={user} allowedRoles={["empleado", "admin"]}>
            <QRScannerView onNavigateToLogin={handleLogoutAndRedirect} />
          </ProtectedRoute>
        }
      />

      {/* RUTAS ROL ADMIN */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute user={user} allowedRoles={["admin"]}>
            <AdminLayout user={user} onLogout={handleLogoutAndRedirect} />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="asistencias" element={<AdminAttendanceDashboard />} />
        <Route path="dependencias" element={<AdminDependencias />} />
        <Route path="qr-cards" element={<PrintableQRCard />} />
      </Route>

      {/* REDIRECCIÓN GLOBAL SEGÚN ROL */}
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
  // Persistencia: Leer sesión desde localStorage al montar la app
  const [user, setUser] = useState<UserSession | null>(() => {
    const saved = localStorage.getItem("user_session");
    if (!saved) return null;
    try {
      return JSON.parse(saved);
    } catch {
      return null;
    }
  });

  // Botón DevTools de Prueba: Limpiar sesión local rápidamente
  const handleClearTestSession = () => {
    localStorage.clear();
    setUser(null);
    window.location.href = "/login";
  };

  return (
    <BrowserRouter>
      <AppRoutes user={user} setUser={setUser} />

      {/* WIDGET / BOTÓN FLOTANTE DE PRUEBAS (DEVTOOLS) */}
      <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 bg-slate-900/90 border border-slate-700/80 p-2 rounded-2xl shadow-xl backdrop-blur-md text-xs">
        <div className="px-2 py-1 bg-slate-800 rounded-lg text-[10px] font-mono text-slate-300">
          Rol: <span className="font-bold text-indigo-400">{user ? user.role : "Anónimo"}</span>
        </div>
        <button
          onClick={handleClearTestSession}
          title="Borrar sesión y reiniciar pruebas"
          className="flex items-center gap-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 px-3 py-1.5 rounded-xl font-medium transition-all text-[11px]"
        >
          <Trash2 className="h-3.5 w-3.5" />
          <span>Reset Session</span>
        </button>
      </div>
    </BrowserRouter>
  );
}