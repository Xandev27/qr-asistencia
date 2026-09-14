import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  CheckCircle2,
  XCircle,
  Loader2,
  Clock,
  Calendar,
  ArrowRight,
} from "lucide-react";
import type { UserSession } from "../types/attendance";

interface DirectAttendanceProps {
  user: UserSession | null;
}

// SIMULACIÓN: Lista de tokens válidos registrados en las sedes
const MOCK_VALID_TOKENS = [
  "DEP_ALCALDIA_89F2A1",
  "DEP_HACIENDA_3C4D1E",
  "TEST_TOKEN",
];

export default function DirectAttendanceHandler({
  user,
}: DirectAttendanceProps) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const qrToken = searchParams.get("token");

  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading",
  );
  const [message, setMessage] = useState<string>(
    "Obteniendo ubicación y validando asistencia...",
  );
  const [markedTime, setMarkedTime] = useState<string>("");
  const [markedDate, setMarkedDate] = useState<string>("");

  useEffect(() => {
    // 1. Validar presencia del token
    if (!qrToken) {
      navigate("/login", { replace: true });
      return;
    }

    // 2. Redirigir al Login si no está logueado
    if (!user) {
      localStorage.setItem("pending_qr_token", qrToken);
      navigate("/login?redirect=marcar", { replace: true });
      return;
    }

    // 3. Procesar marcaje con simulación de servidor
    const processAttendance = async () => {
      if (!navigator.geolocation) {
        setStatus("error");
        setMessage("Tu navegador no soporta geolocalización.");
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (_position) => {
          try {
            // Simular tiempo de respuesta de red (1.5 segundos)
            await new Promise((resolve) => setTimeout(resolve, 1500));

            // Validación MOCK: Verificar si el token existe
            if (!MOCK_VALID_TOKENS.includes(qrToken)) {
              setStatus("error");
              setMessage(
                "El código QR escaneado no pertenece a ninguna sede válida.",
              );
              return;
            }

            // Marcaje simulado con éxito
            const now = new Date();

            const timeString = now.toLocaleTimeString("es-ES", {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
              hour12: true,
            });

            const dateString = now.toLocaleDateString("es-ES", {
              weekday: "long",
              day: "numeric",
              month: "long",
            });

            setMarkedTime(timeString);
            setMarkedDate(
              dateString.charAt(0).toUpperCase() + dateString.slice(1),
            );
            setStatus("success");

            // Redirección automática tras 5 segundos
            setTimeout(() => {
              navigate("/scan", { replace: true });
            }, 5000);
            
          } catch (err) {
            setStatus("error");
            setMessage("Error simulado al procesar el marcaje.");
          }
        },
        (error) => {
          setStatus("error");
          if (error.code === error.PERMISSION_DENIED) {
            setMessage(
              "Debes permitir el acceso a la ubicación para registrar tu asistencia.",
            );
          } else {
            setMessage("No se pudo obtener tu ubicación actual.");
          }
        },
        { enableHighAccuracy: true, timeout: 10000 },
      );
    };

    processAttendance();
  }, [user, qrToken, navigate]);

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl max-w-sm w-full text-center shadow-2xl space-y-6 relative overflow-hidden">
        {/* ESTADO: CARGANDO */}
        {status === "loading" && (
          <div className="flex flex-col items-center gap-4 py-6">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-indigo-500/20 blur-xl animate-pulse"></div>
              <Loader2 className="h-14 w-14 text-indigo-500 animate-spin relative" />
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-white">
                Procesando Marcaje
              </h2>
              <p className="text-xs text-slate-400 max-w-[240px] mx-auto">
                {message}
              </p>
            </div>
          </div>
        )}

        {/* ESTADO: ÉXITO */}
        {status === "success" && (
          <div className="flex flex-col items-center gap-5">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-emerald-500/20 blur-2xl animate-pulse"></div>
              <div className="p-4 bg-emerald-500/10 border-2 border-emerald-500/30 rounded-full text-emerald-400 relative">
                <CheckCircle2 className="h-14 w-14" />
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-bold tracking-widest text-emerald-400 uppercase bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                ¡Marcaje Exitoso!
              </span>
              <h2 className="text-2xl font-extrabold text-white pt-1">
                Asistencia Registrada
              </h2>
            </div>

            <div className="w-full bg-slate-800/80 border border-slate-700/60 p-4 rounded-2xl space-y-2">
              <div className="flex items-center justify-center gap-2 text-3xl font-black text-emerald-400 tracking-tight font-mono">
                <Clock className="h-6 w-6 text-emerald-400" />
                <span>{markedTime}</span>
              </div>
              <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400">
                <Calendar className="h-3.5 w-3.5 text-slate-500" />
                <span>{markedDate}</span>
              </div>
            </div>

            <div className="w-full space-y-2">
              <button
                onClick={() => navigate("/")}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3 rounded-xl transition-all shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 text-sm"
              >
                <span>Volver al inicio</span>
                <ArrowRight className="h-4 w-4" />
              </button>
              <p className="text-[11px] text-slate-500">
                Redirigiendo automáticamente en unos segundos...
              </p>
            </div>
          </div>
        )}

        {/* ESTADO: ERROR */}
        {status === "error" && (
          <div className="flex flex-col items-center gap-4 py-2">
            <div className="p-4 bg-rose-500/10 border-2 border-rose-500/30 rounded-full text-rose-400">
              <XCircle className="h-12 w-12" />
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-rose-400">
                Error al Marcar
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed">
                {message}
              </p>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="mt-2 w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 rounded-xl transition-all text-xs"
            >
              Reintentar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
