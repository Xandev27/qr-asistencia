import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { LogIn, Mail, Lock, AlertCircle, Loader2, QrCode, Shield, User } from "lucide-react";
import type { UserSession } from "../types/attendance";

interface LoginProps {
  onLoginSuccess?: (user: UserSession) => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isPendingAttendance = searchParams.get("redirect") === "marcar";

  const executeMockLogin = async (selectedEmail: string, role: "admin" | "empleado") => {
    setLoading(true);
    setErrorMsg(null);

    // Simulación de latencia de red
    await new Promise((resolve) => setTimeout(resolve, 1200));

    // Crear objeto de usuario simulado
    const mockUser: UserSession = {
      id: role === "admin" ? "usr_admin_01" : "usr_emp_01",
      email: selectedEmail || (role === "admin" ? "admin@institucion.gob.ve" : "empleado@institucion.gob.ve"),
      role: role,
      name: role === "admin" ? "Administrador de Sede" : "Juan Pérez",
    };

    // Actualizar el estado global de la app
    if (onLoginSuccess) {
      onLoginSuccess(mockUser);
    }

    // 1. CASO QR PENDIENTE: Si venía de escanear un QR sin estar logueado
    const pendingToken = localStorage.getItem("pending_qr_token");
    if (pendingToken) {
      localStorage.removeItem("pending_qr_token");
      navigate(`/marcar?token=${pendingToken}`, { replace: true });
      return;
    }

    // 2. INGRESO NORMAL: Redirección según rol
    if (mockUser.role === "admin") {
      navigate("/admin/dashboard", { replace: true });
    } else {
      // Si es un empleado sin marcaje previo, lo enviamos directo a escanear QR
      navigate("/scan", { replace: true });
    }

    setLoading(false);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg("Ingresa tu correo y contraseña.");
      return;
    }
    const role = email.includes("admin") ? "admin" : "empleado";
    executeMockLogin(email, role);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl p-8 shadow-2xl space-y-6">
        
        {/* ENCABEZADO */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl text-indigo-400 mb-1">
            <LogIn className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            Iniciar Sesión
          </h1>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            Ingresa tus credenciales institucionales para acceder al sistema
          </p>
        </div>

        {/* ALERTA DE QR PENDIENTE */}
        {isPendingAttendance && (
          <div className="bg-amber-500/10 border border-amber-500/30 p-3.5 rounded-2xl flex items-center gap-3 text-amber-300 text-xs animate-pulse">
            <QrCode className="h-5 w-5 flex-shrink-0 text-amber-400" />
            <span>
              Inicia sesión para completar tu marcaje de asistencia pendiente.
            </span>
          </div>
        )}

        {/* ALERTA DE ERROR */}
        {errorMsg && (
          <div className="bg-rose-500/10 border border-rose-500/30 p-3.5 rounded-2xl flex items-center gap-3 text-rose-300 text-xs">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* FORMULARIO */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">
              Correo Electrónico
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="usuario@dominio.com"
                className="w-full bg-slate-950/60 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">
              Contraseña
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950/60 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 rounded-xl transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Autenticando...</span>
              </>
            ) : (
              <span>Ingresar</span>
            )}
          </button>
        </form>

        {/* ACCESOS RÁPIDOS PARA PRUEBAS (DESARROLLO) */}
        <div className="pt-2 border-t border-slate-800/80 space-y-2">
          <p className="text-[11px] text-slate-500 text-center font-medium uppercase tracking-wider">
            Accesos de prueba rápidos
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setEmail("admin@institucion.gob.ve");
                setPassword("123456");
                executeMockLogin("admin@institucion.gob.ve", "admin");
              }}
              disabled={loading}
              className="flex items-center justify-center gap-1.5 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 text-slate-300 hover:text-white py-2 px-3 rounded-xl text-xs transition-all"
            >
              <Shield className="h-3.5 w-3.5 text-indigo-400" />
              <span>Como Admin</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setEmail("empleado@institucion.gob.ve");
                setPassword("123456");
                executeMockLogin("empleado@institucion.gob.ve", "empleado");
              }}
              disabled={loading}
              className="flex items-center justify-center gap-1.5 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 text-slate-300 hover:text-white py-2 px-3 rounded-xl text-xs transition-all"
            >
              <User className="h-3.5 w-3.5 text-emerald-400" />
              <span>Como Empleado</span>
            </button>
          </div>
        </div>

        {/* FOOTER */}
        <div className="text-center pt-2 border-t border-slate-800/60">
          <p className="text-[11px] text-slate-500">
            Control de Asistencia Biométrico / GPS &copy; {new Date().getFullYear()}
          </p>
        </div>

      </div>
    </div>
  );
}