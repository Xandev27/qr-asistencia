// components/Login.tsx
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { LogIn, Mail, Lock, AlertCircle, Loader2, QrCode, Shield } from "lucide-react";
import { supabase } from "../utils/supabaseClient";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isPendingAttendance = searchParams.get("redirect") === "marcar";

  useEffect(() => {
    if (!user) return;

    // Si hay un token guardado previamente, redirigir a marcar asistencia
    const pendingToken = localStorage.getItem("pending_qr_token");
    if (pendingToken) {
      localStorage.removeItem("pending_qr_token");
      navigate(`/marcar?token=${pendingToken}`, { replace: true });
      return;
    }

    // Redirección por rol estándar
    const redirectUrl = ["admin", "superadmin"].includes(user.role)
      ? "/admin/dashboard"
      : "/scan";
    navigate(redirectUrl, { replace: true });
  }, [user, navigate]);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw new Error("Credenciales inválidas o sin permisos suficientes.");
    } catch (err: any) {
      setErrorMsg(err.message || "Error al iniciar sesión.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setErrorMsg(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/scan` },
      });
      if (error) throw new Error("No se pudo conectar con Google.");
    } catch (err: any) {
      setErrorMsg(err.message);
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl p-8 shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl text-indigo-400 mb-1">
            <LogIn className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Acceso al Sistema</h1>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">Control de asistencia institucional</p>
        </div>

        {isPendingAttendance && (
          <div className="bg-amber-500/10 border border-amber-500/30 p-3.5 rounded-2xl flex items-center gap-3 text-amber-300 text-xs animate-pulse">
            <QrCode className="h-5 w-5 shrink-0 text-amber-400" />
            <span>Inicia sesión para completar tu marcaje de asistencia pendiente.</span>
          </div>
        )}

        {errorMsg && (
          <div className="bg-rose-500/10 border border-rose-500/30 p-3.5 rounded-2xl flex items-center gap-3 text-rose-300 text-xs">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="space-y-3">
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={googleLoading || loading}
            className="w-full bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-white font-medium py-3 rounded-xl transition-all flex items-center justify-center gap-3 text-sm disabled:opacity-50"
          >
            <img src="https://www.svgrepo.com/show/355037/google.svg" className="w-5 h-5" alt="Google" />
            {googleLoading ? <Loader2 className="h-4 w-4 animate-spin text-indigo-400" /> : "Continuar con Google"}
          </button>
        </div>

        <div className="relative flex items-center justify-center py-1">
          <div className="border-t border-slate-800 w-full" />
          <span className="bg-slate-900 px-3 text-[11px] text-slate-500 font-medium uppercase tracking-wider shrink-0">o acceso administrativo</span>
          <div className="border-t border-slate-800 w-full" />
        </div>

        <form onSubmit={handleAdminLogin} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5 text-indigo-400" /> Correo Administrativo
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@institucion.gob.ve"
                className="w-full bg-slate-950/60 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">Contraseña</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950/60 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || googleLoading}
            className="w-full mt-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Ingresar como Admin"}
          </button>
        </form>
      </div>
    </div>
  );
}