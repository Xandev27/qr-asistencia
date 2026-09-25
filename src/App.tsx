import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate, Outlet } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import SidebarLayout from "./components/NavBar";
import Login from "./components/Login";
import { Loader2 } from "lucide-react";

// Code Splitting mediante React.lazy
const AdminDashboard = lazy(() => import("./components/AdminDashboard").then(m => ({ default: m.AdminDashboard })));
const AdminAttendanceDashboard = lazy(() => import("./components/AdminAttendanceDashboard"));
const AttendanceReportSheet = lazy(() => import("./components/AdminAttendanceAnalytics"));
const QRScannerView = lazy(() => import("./components/QRScannerView").then(m => ({ default: m.QRScannerView })));
const PrintableQRCard = lazy(() => import("./components/PrintableQRCard"));
const AdminDependencias = lazy(() => import("./components/AdminDependencias").then(m => ({ default: m.AdminDependencias })));
const DirectAttendanceHandler = lazy(() => import("./components/DirectAttendanceHandler"));
const EmployeeManagement = lazy(() => import("./components/AdminPersonal"));

const PageLoader = () => (
  <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-xs gap-2">
    <Loader2 className="h-5 w-5 animate-spin text-indigo-500" />
    <span>Cargando módulo...</span>
  </div>
);

function AdminLayout() {
  const { user, logout } = useAuth();
  return (
    <SidebarLayout user={user} onLogout={logout}>
      <Suspense fallback={<PageLoader />}>
        <Outlet />
      </Suspense>
    </SidebarLayout>
  );
}

function TestRoleSelector() {
  const { login } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-slate-800 border border-slate-700 p-8 rounded-3xl shadow-2xl text-center max-w-sm w-full space-y-4">
        <h1 className="text-xl font-bold text-white">Selector de Roles (Test)</h1>
        <button
          onClick={() => {
            login({ id: "usr_admin_01", email: "admin@test.com", role: "admin", name: "Superusuario Admin" });
            navigate("/admin/dashboard", { replace: true });
          }}
          className="w-full bg-indigo-600 text-white py-3 rounded-xl text-xs font-semibold"
        >
          Ingresar como Admin
        </button>
        <button
          onClick={() => {
            login({ id: "usr_emp_01", email: "empleado@test.com", role: "empleado", name: "Juan Pérez" });
            navigate("/scan", { replace: true });
          }}
          className="w-full bg-slate-700 text-white py-3 rounded-xl text-xs font-semibold"
        >
          Ingresar como Empleado
        </button>
      </div>
    </div>
  );
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/test" element={<TestRoleSelector />} />
        <Route path="/marcar" element={<DirectAttendanceHandler />} />

        <Route
          path="/scan"
          element={
            <ProtectedRoute allowedRoles={["empleado", "admin", "superadmin"]}>
              <QRScannerView onNavigateToLogin={() => {}} />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={["admin", "superadmin"]}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="asistencias" element={<AdminAttendanceDashboard />} />
          <Route path="asistencias/informe-promedios" element={<AttendanceReportSheet />} />
          <Route path="dependencias" element={<AdminDependencias />} />
          <Route path="qr-cards" element={<PrintableQRCard />} />
          <Route path="empleados" element={<EmployeeManagement />} />
        </Route>

        <Route
          path="*"
          element={
            user ? (
              <Navigate to={user.role === "admin" || user.role === "superadmin" ? "/admin/dashboard" : "/scan"} replace />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
      </Routes>
    </Suspense>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}