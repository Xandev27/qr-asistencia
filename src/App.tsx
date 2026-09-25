import { lazy, Suspense } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import SidebarLayout from "./components/NavBar";
import Login from "./components/Login";
import { Loader2 } from "lucide-react";

// Code Splitting mediante React.lazy
const AdminDashboard = lazy(() =>
  import("./components/AdminDashboard").then((m) => ({
    default: m.AdminDashboard,
  })),
);
const AdminAttendanceDashboard = lazy(
  () => import("./components/AdminAttendanceDashboard"),
);
const AttendanceReportSheet = lazy(
  () => import("./components/AdminAttendanceAnalytics"),
);
const QRScannerView = lazy(() =>
  import("./components/QRScannerView").then((m) => ({
    default: m.QRScannerView,
  })),
);
const PrintableQRCard = lazy(() => import("./components/PrintableQRCard"));
const AdminDependencias = lazy(() =>
  import("./components/AdminDependencias").then((m) => ({
    default: m.AdminDependencias,
  })),
);
const DirectAttendanceHandler = lazy(
  () => import("./components/DirectAttendanceHandler"),
);
const EmployeeManagement = lazy(() => import("./components/AdminPersonal"));
const CompleteProfileModal = lazy(() =>
  import("./components/CompleteProfileModal").then((m) => ({
    default: m.CompleteProfileModal,
  })),
);

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

function AppRoutes() {
  const { user, needsProfileCompletion, updateUserProfile } = useAuth();

  return (
    <>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/marcar" element={<DirectAttendanceHandler />} />

          <Route
            path="/scan"
            element={
              <ProtectedRoute
                allowedRoles={["employee", "admin", "superadmin"]}
              >
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
            <Route
              path="asistencias/informe-promedios"
              element={<AttendanceReportSheet />}
            />
            <Route path="dependencias" element={<AdminDependencias />} />
            <Route path="qr-cards" element={<PrintableQRCard />} />
            <Route path="empleados" element={<EmployeeManagement />} />
          </Route>

          <Route
            path="*"
            element={
              user ? (
                <Navigate
                  to={
                    user.role === "admin" || user.role === "superadmin"
                      ? "/admin/dashboard"
                      : "/scan"
                  }
                  replace
                />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
        </Routes>
      </Suspense>

      {/* Modal flotante tras login con Google si no tiene nombre/apellido */}
      {user && needsProfileCompletion && (
        <Suspense fallback={null}>
          <CompleteProfileModal
            userId={user.id}
            defaultName={user.name}
            onProfileCompleted={({ firstName, lastName }) => {
              updateUserProfile(firstName, lastName);
            }}
          />
        </Suspense>
      )}
    </>
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