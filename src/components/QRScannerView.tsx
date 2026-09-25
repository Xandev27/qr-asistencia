import React, { useEffect, useState, useRef } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { useAuth } from "../context/AuthContext";
import type { Coordinates } from "../types/attendance";
import { supabase } from "../utils/supabaseClient";
import {
  LogOut,
  MapPin,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Clock,
  Building2,
} from "lucide-react";
import { getHaversineDistance } from "../utils/geo";

interface QRScannerViewProps {
  onNavigateToLogin?: () => void;
}

interface AttendanceSuccessData {
  branchName: string;
  timeString: string;
  dateString: string;
  distanceMeters: number;
}

export const QRScannerView: React.FC<QRScannerViewProps> = () => {
  const { user, logout } = useAuth();

  const [isInitializing, setIsInitializing] = useState<boolean>(true);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [hasGpsPermission, setHasGpsPermission] = useState<boolean>(false);

  const [statusMessage, setStatusMessage] = useState<string>(
    "Verificando marcaje del día...",
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<AttendanceSuccessData | null>(
    null,
  );

  const html5QrcodeRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerId = "qr-reader-container";

  const extractToken = (scannedText: string): string => {
    try {
      const url = new URL(scannedText);
      const tokenFromParam = url.searchParams.get("token");
      if (tokenFromParam) {
        return tokenFromParam;
      }
    } catch {
      // Si no es URL, retorna el string limpio
    }
    return scannedText.trim();
  };

  const getCurrentLocation = (): Promise<Coordinates> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(
          new Error("La geolocalización no es soportada por este navegador."),
        );
        return;
      }

      const timer = setTimeout(() => {
        reject(
          new Error(
            "Tiempo de espera agotado al obtener el GPS. Revisa los permisos de tu dispositivo.",
          ),
        );
      }, 8000);

      navigator.geolocation.getCurrentPosition(
        (position) => {
          clearTimeout(timer);
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          });
        },
        (error) => {
          clearTimeout(timer);
          switch (error.code) {
            case error.PERMISSION_DENIED:
              reject(
                new Error(
                  "Permiso GPS denegado. Es obligatorio activarlo para escanear asistencia.",
                ),
              );
              break;
            case error.POSITION_UNAVAILABLE:
              reject(
                new Error(
                  "Ubicación no disponible. Activa el GPS de tu dispositivo.",
                ),
              );
              break;
            case error.TIMEOUT:
              reject(
                new Error(
                  "No se pudo obtener la ubicación a tiempo. Reintenta.",
                ),
              );
              break;
            default:
              reject(new Error("Error al obtener la ubicación GPS."));
          }
        },
        { enableHighAccuracy: true, timeout: 7000, maximumAge: 0 },
      );
    });
  };

  // Helper para formatear las respuestas de la BD en successData
  const formatAttendanceResponse = (
    branchName: string,
    isoTimestamp: string,
    distanceMeters: number = 0,
  ): AttendanceSuccessData => {
    const serverDate = new Date(isoTimestamp);
    return {
      branchName,
      timeString: serverDate.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      }),
      dateString: serverDate.toLocaleDateString([], {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      distanceMeters,
    };
  };

  // 1. Verificación Inicial: Asistencia Previa y Permisos GPS
  useEffect(() => {
    let isMounted = true;

    const checkExistingAttendanceAndGps = async () => {
      // Si aún no hay usuario en el AuthContext, esperamos
      if (!user?.id) return;

      try {
        setStatusMessage("Verificando marcaje de hoy...");

        // Calcular inicio de jornada actual (7:00 AM)
        const now = new Date();
        const currentHour = now.getHours();

        const cycleStart = new Date(now);
        if (currentHour < 7) {
          cycleStart.setDate(cycleStart.getDate() - 1);
        }
        cycleStart.setHours(7, 0, 0, 0);

        const cycleStartISO = cycleStart.toISOString();

        // Consulta directa a la tabla de asistencias sin pasar por RPC
        const { data: scanData, error: scanError } = await supabase
          .from("asistencias")
          .select(
            `
          id,
          timestamp,
          dependencias (
            name
          )
        `,
          )
          .eq("user_id", user.id)
          .gte("timestamp", cycleStartISO)
          .order("timestamp", { ascending: false })
          .limit(1);

        if (scanError) {
          console.error("Error al verificar asistencia previa:", scanError);
        }

        // Si existe un registro en el ciclo actual
        if (scanData && scanData.length > 0) {
          const record = scanData[0];
          const branchName =
            (record.dependencias as any)?.name || "Sede Registrada";

          if (isMounted) {
            setSuccessData(
              formatAttendanceResponse(branchName, record.timestamp, 0),
            );
            setIsInitializing(false);
            return;
          }
        }

        // Si no hay marcaje previo, proceder con la solicitud de GPS
        setStatusMessage("Solicitando permisos de ubicación GPS...");
        await getCurrentLocation();

        if (isMounted) {
          setHasGpsPermission(true);
          setErrorMessage(null);
        }
      } catch (err: any) {
        if (isMounted) {
          setHasGpsPermission(false);
          setErrorMessage(
            err.message ||
              "Es necesario dar permisos de ubicación para continuar.",
          );
        }
      } finally {
        if (isMounted) setIsInitializing(false);
      }
    };

    checkExistingAttendanceAndGps();

    return () => {
      isMounted = false;
    };
  }, [user]); // Escuchar cambios en la variable 'user'

  // 2. Inicialización de Cámara (Solo si no hay éxito previo)
  useEffect(() => {
    if (isInitializing || !hasGpsPermission || successData) return;

    const html5Qrcode = new Html5Qrcode(scannerContainerId, {
      formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
      verbose: false,
    });

    html5QrcodeRef.current = html5Qrcode;

    const qrConfig = { fps: 10, qrbox: { width: 240, height: 240 } };

    html5Qrcode
      .start(
        { facingMode: "environment" },
        qrConfig,
        (decodedText) => handleQrScanned(decodedText),
        () => {},
      )
      .then(() => {
        setStatusMessage("Apunta la cámara al código QR de la sede");
      })
      .catch((err) => {
        console.error("Error al iniciar cámara:", err);
        setErrorMessage(
          "No se pudo acceder a la cámara. Revisa los permisos de tu navegador.",
        );
      });

    return () => {
      if (html5QrcodeRef.current) {
        if (html5QrcodeRef.current.isScanning) {
          html5QrcodeRef.current
            .stop()
            .then(() => html5QrcodeRef.current?.clear())
            .catch((e) => console.error("Error al detener scanner:", e));
        } else {
          html5QrcodeRef.current.clear();
        }
      }
    };
  }, [isInitializing, hasGpsPermission, successData]);

  const handleQrScanned = async (rawQrText: string) => {
    if (isProcessing) return;

    setIsProcessing(true);
    setErrorMessage(null);
    setSuccessData(null);
    setStatusMessage("Código QR detectado. Obteniendo ubicación GPS...");

    if (html5QrcodeRef.current?.isScanning) {
      html5QrcodeRef.current.pause(true);
    }

    try {
      const cleanToken = extractToken(rawQrText);

      // Coordenadas GPS
      const location = await getCurrentLocation();
      setStatusMessage("Verificando datos de la sede...");

      // Datos de la sede
      const { data: branch, error: branchError } = await supabase
        .from("dependencias")
        .select("id, name, latitude, longitude, radius_meters")
        .eq("qr_token", cleanToken)
        .single();

      if (branchError || !branch) {
        throw new Error(
          "El código QR escaneado no pertenece a ninguna sede válida.",
        );
      }

      // 3. Geocerca
      const distanceMeters = getHaversineDistance(
        location.latitude,
        location.longitude,
        Number(branch.latitude),
        Number(branch.longitude),
      );

      const allowedRadius = branch.radius_meters || 50;

      if (distanceMeters > allowedRadius) {
        throw new Error(
          `Te encuentras fuera del rango permitido para ${branch.name}. Distancia actual: ${Math.round(
            distanceMeters,
          )}m (Máximo permitido: ${allowedRadius}m).`,
        );
      }

      setStatusMessage("Registrando marcaje de asistencia...");

      // 4. Registro vía RPC
      const { data, error: rpcError } = await supabase.rpc(
        "registrar_asistencia_diaria",
        {
          p_user_id: user?.id,
          p_dependencia_id: branch.id,
          p_latitude: location.latitude,
          p_longitude: location.longitude,
        },
      );

      if (rpcError) {
        throw new Error(rpcError.message);
      }

      const result = data[0];

      // Detener cámara
      if (html5QrcodeRef.current?.isScanning) {
        await html5QrcodeRef.current.stop();
        html5QrcodeRef.current.clear();
      }

      setSuccessData(
        formatAttendanceResponse(
          result.dependencia_name,
          result.created_at,
          Math.round(distanceMeters),
        ),
      );
    } catch (err: any) {
      setErrorMessage(err.message || "Error al registrar la asistencia.");
      setStatusMessage("Apunta nuevamente al código QR.");

      if (html5QrcodeRef.current) {
        html5QrcodeRef.current.resume();
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const retryGpsPermission = async () => {
    setIsInitializing(true);
    setErrorMessage(null);
    try {
      await getCurrentLocation();
      setHasGpsPermission(true);
    } catch (err: any) {
      setHasGpsPermission(false);
      setErrorMessage(
        err.message || "No se otorgaron los permisos de ubicación.",
      );
    } finally {
      setIsInitializing(false);
    }
  };

  if (isInitializing) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-white p-4">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500 mb-3" />
        <p className="text-xs text-slate-400 font-medium">{statusMessage}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-between min-h-screen bg-slate-950 text-slate-100 p-4">
      {/* Header del Usuario */}
      <header className="w-full max-w-md flex justify-between items-center py-4 border-b border-slate-800">
        <div>
          <h1 className="text-base font-bold text-white">
            {user?.name || "Empleado"}
          </h1>
          <p className="text-xs text-slate-400 capitalize">{user?.email}</p>
        </div>
        <button
          onClick={() => logout()}
          className="flex items-center gap-1.5 text-xs bg-slate-900 hover:bg-slate-800 text-slate-300 px-3 py-2 rounded-xl border border-slate-800 transition"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span>Salir</span>
        </button>
      </header>

      {/* Visor / Resultado de Éxito */}
      <main className="w-full max-w-md flex flex-col items-center my-auto">
        {!successData ? (
          <div className="relative w-full bg-slate-900 rounded-3xl overflow-hidden border border-slate-800 shadow-2xl min-h-75 flex items-center justify-center">
            <div id={scannerContainerId} className="w-full h-full" />

            {/* Sin Permiso GPS */}
            {!hasGpsPermission && (
              <div className="absolute inset-0 bg-slate-950 p-6 flex flex-col items-center justify-center text-center gap-4 z-10">
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400">
                  <MapPin className="h-8 w-8" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold text-white">
                    Ubicación Requerida
                  </h3>
                  <p className="text-xs text-slate-400 max-w-62.5">
                    Es necesario activar y permitir el acceso al GPS para
                    escanear asistencia.
                  </p>
                </div>
                <button
                  onClick={retryGpsPermission}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs px-5 py-2.5 rounded-xl transition shadow-lg shadow-indigo-600/20"
                >
                  Reintentar Permiso
                </button>
              </div>
            )}

            {/* Overlay Procesando */}
            {isProcessing && (
              <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm flex flex-col items-center justify-center gap-3 p-4 text-center z-20">
                <Loader2 className="h-9 w-9 animate-spin text-indigo-500" />
                <p className="text-xs font-medium text-indigo-300">
                  {statusMessage}
                </p>
              </div>
            )}
          </div>
        ) : (
          /* TARJETA DE CONFIRMACIÓN DE ÉXITO */
          <div className="w-full bg-slate-900 border border-emerald-500/30 rounded-3xl p-6 shadow-2xl space-y-5 text-center animate-in fade-in zoom-in-95 duration-300">
            <div className="inline-flex p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400">
              <CheckCircle2 className="h-10 w-10" />
            </div>

            <div className="space-y-1">
              <h2 className="text-xl font-bold text-white tracking-tight">
                ¡Asistencia Registrada!
              </h2>
              <p className="text-xs text-slate-400">
                Ya has completado tu marcaje correspondiente a esta jornada.
              </p>
            </div>

            {/* Detalles del Registro */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 space-y-3 text-left text-xs">
              <div className="flex items-center gap-3 text-slate-200">
                <Building2 className="h-4 w-4 text-indigo-400 shrink-0" />
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                    Sede
                  </p>
                  <p className="font-medium text-slate-100">
                    {successData.branchName}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-slate-200">
                <Clock className="h-4 w-4 text-emerald-400 shrink-0" />
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                    Hora de Registro
                  </p>
                  <p className="font-semibold text-emerald-400 text-sm">
                    {successData.timeString}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-slate-200">
                <MapPin className="h-4 w-4 text-amber-400 shrink-0" />
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                    Fecha
                  </p>
                  <p className="font-medium text-slate-300 capitalize">
                    {successData.dateString}
                  </p>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 italic">
              El próximo marcaje estará disponible a partir de las 07:00 AM.
            </p>
          </div>
        )}

        {/* Notificaciones de Error */}
        <div className="w-full mt-4 text-center space-y-2">
          {errorMessage && (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-300 p-3 rounded-2xl text-xs flex items-center justify-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>
      </main>

      <footer className="w-full max-w-md text-center py-4 text-[11px] text-slate-500">
        Control de Asistencia Biométrico / GPS
      </footer>
    </div>
  );
};
