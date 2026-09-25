// components/DirectAttendanceHandler.tsx
import { useEffect, useState, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const MOCK_VALID_TOKENS = ["DEP_ALCALDIA_89F2A1", "DEP_HACIENDA_3C4D1E", "TEST_TOKEN"];

export default function DirectAttendanceHandler() {
  const { user, loading: authLoading } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const qrToken = searchParams.get("token");

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState<string>("Obteniendo ubicación y validando asistencia...");
  const [markedTime, setMarkedTime] = useState<string>("");
  const [markedDate, setMarkedDate] = useState<string>("");

  const hasProcessed = useRef(false);

  useEffect(() => {
    // Esperar a que el contexto termine de inicializarse
    if (authLoading) return;

    if (!qrToken) {
      navigate("/login", { replace: true });
      return;
    }

    if (!user) {
      localStorage.setItem("pending_qr_token", qrToken);
      navigate("/login?redirect=marcar", { replace: true });
      return;
    }

    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const processAttendance = async () => {
      if (!navigator.geolocation) {
        setStatus("error");
        setMessage("Tu navegador no soporta geolocalización.");
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async () => {
          try {
            await new Promise((resolve) => setTimeout(resolve, 1200));

            if (!MOCK_VALID_TOKENS.includes(qrToken)) {
              setStatus("error");
              setMessage("El código QR escaneado no pertenece a ninguna sede válida.");
              return;
            }

            const now = new Date();
            setMarkedTime(now.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true }));
            const d = now.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" });
            setMarkedDate(d.charAt(0).toUpperCase() + d.slice(1));
            setStatus("success");
          } catch {
            setStatus("error");
            setMessage("Error al procesar el marcaje.");
          }
        },
        (error) => {
          setStatus("error");
          setMessage(error.code === error.PERMISSION_DENIED ? "Permite el acceso a la ubicación para registrar tu asistencia." : "No se pudo obtener la ubicación.");
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    };

    processAttendance();
  }, [user, authLoading, qrToken, navigate]);

  if (authLoading || status === "loading") {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl max-w-sm w-full text-center shadow-2xl space-y-4">
          <Loader2 className="h-12 w-12 text-indigo-500 animate-spin mx-auto" />
          <p className="text-xs text-slate-400">{message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl max-w-sm w-full text-center shadow-2xl space-y-6">
        {status === "success" && (
          <div className="flex flex-col items-center gap-4">
            <CheckCircle2 className="h-12 w-12 text-emerald-400" />
            <h2 className="text-xl font-bold">Asistencia Registrada</h2>
            <div className="bg-slate-800 p-4 rounded-2xl w-full">
              <p className="text-2xl font-mono font-bold text-emerald-400">{markedTime}</p>
              <p className="text-xs text-slate-400">{markedDate}</p>
            </div>
            <button onClick={() => navigate("/scan", { replace: true })} className="w-full bg-emerald-600 hover:bg-emerald-500 py-3 rounded-xl text-sm font-semibold">
              Volver al escáner
            </button>
          </div>
        )}

        {status === "error" && (
          <div className="flex flex-col items-center gap-4">
            <XCircle className="h-12 w-12 text-rose-400" />
            <p className="text-xs text-slate-300">{message}</p>
            <button onClick={() => window.location.reload()} className="w-full bg-indigo-600 py-3 rounded-xl text-xs font-semibold">
              Reintentar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}