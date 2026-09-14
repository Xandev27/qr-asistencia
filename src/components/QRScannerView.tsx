import React, { useEffect, useState, useRef } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import type {
  Coordinates,
  AttendancePayload,
  UserSession,
} from "../types/attendance";

interface QRScannerViewProps {
  onNavigateToLogin: () => void;
  // apiEndpoint = "/api/asistencia/registrar",
}

export const QRScannerView: React.FC<QRScannerViewProps> = ({
  onNavigateToLogin,
}) => {
  // Estados de sesión
  const [session, setSession] = useState<UserSession | null>(null);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Estado para verificar si el permiso de GPS fue otorgado
  const [hasGpsPermission, setHasGpsPermission] = useState<boolean>(false);

  // Estados de retroalimentación
  const [statusMessage, setStatusMessage] = useState<string>(
    "Verificando sesión y GPS...",
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Referencias para html5-qrcode
  const html5QrcodeRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerId = "qr-reader-container";

  // Captura del GPS Nativo del Navegador (Función auxiliar reutilizable)
  const getCurrentLocation = (): Promise<Coordinates> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocalización no soportada por el dispositivo."));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          });
        },
        (error) => {
          switch (error.code) {
            case error.PERMISSION_DENIED:
              reject(
                new Error(
                  "Permiso GPS denegado. Es obligatorio otorgarlo para escanear asistencia.",
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
                  "Tiempo de espera agotado al obtener el GPS. Intenta de nuevo.",
                ),
              );
              break;
            default:
              reject(new Error("Error al obtener la geolocalización."));
          }
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
      );
    });
  };

  // 1. Verificación de Sesión Activa y Solicitud Inicial de Permiso GPS
  useEffect(() => {
    const initView = async () => {
      const storedSession = localStorage.getItem("user_session");

      if (!storedSession) {
        setErrorMessage("Sesión no encontrada. Redirigiendo al login...");
        setTimeout(() => onNavigateToLogin(), 1500);
        return;
      }

      try {
        const parsedSession: UserSession = JSON.parse(storedSession);
        setSession(parsedSession);

        // Solicitar explícitamente el permiso del GPS desde la carga del componente
        setStatusMessage("Solicitando permisos de ubicación GPS...");
        await getCurrentLocation();
        setHasGpsPermission(true);
      } catch (err: any) {
        setHasGpsPermission(false);
        setErrorMessage(
          err.message || "Es necesario dar permisos de ubicación para continuar.",
        );
      } finally {
        setIsInitializing(false);
      }
    };

    initView();
  }, [onNavigateToLogin]);

  // 2. Inicialización y Limpieza de Html5Qrcode (Solo arranca si hay GPS)
  useEffect(() => {
    if (isInitializing || !session || !hasGpsPermission) return;

    // Crear la instancia limitando el escaneo solo a códigos QR
    const html5Qrcode = new Html5Qrcode(scannerContainerId, {
      formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
      verbose: false,
    });

    html5QrcodeRef.current = html5Qrcode;

    const qrConfig = {
      fps: 10,
      qrbox: { width: 250, height: 250 },
    };

    // Iniciar la cámara trasera
    html5Qrcode
      .start(
        { facingMode: "environment" },
        qrConfig,
        (decodedText) => {
          handleQrScanned(decodedText);
        },
        () => {
          // Ignorar errores frame a frame por falta de QR en pantalla
        },
      )
      .then(() => {
        setStatusMessage("Apunta la cámara al código QR de la sede");
      })
      .catch((err) => {
        console.error("Error al iniciar la cámara con html5-qrcode:", err);
        setErrorMessage(
          "No se pudo acceder a la cámara. Revisa los permisos de tu dispositivo.",
        );
      });

    // Cierre limpio de la cámara al desmontar el componente
    return () => {
      if (html5QrcodeRef.current && html5QrcodeRef.current.isScanning) {
        html5QrcodeRef.current
          .stop()
          .then(() => html5QrcodeRef.current?.clear())
          .catch((err) => console.error("Error al detener la cámara:", err));
      }
    };
  }, [isInitializing, session, hasGpsPermission]);

  // 3. MOCK: Procesamiento solo para Pruebas (Sin envío a Backend)
  const handleQrScanned = async (qrToken: string) => {
    if (isProcessing) return;

    setIsProcessing(true);
    setErrorMessage(null);
    setStatusMessage("QR detectado. Obteniendo ubicación GPS...");

    // Pausar el escaneo en html5-qrcode mientras se simula el proceso
    if (html5QrcodeRef.current && html5QrcodeRef.current.isScanning) {
      html5QrcodeRef.current.pause(true);
    }

    try {
      // Re-obtener coordenadas GPS en el momento exacto del escaneo
      const location = await getCurrentLocation();

      setStatusMessage("Simulando validación con servidor...");

      const payload: AttendancePayload = { qrToken, location };

      console.log("--- MOCK TEST: Datos de Marcaje Capturados ---");
      console.log("Token QR:", qrToken);
      console.log("Ubicación GPS:", location);
      console.log("Payload Completo:", payload);
      console.log("---------------------------------------------");

      // Simular latencia de red (1.5 segundos)
      await new Promise((resolve) => setTimeout(resolve, 1500));

      setSuccessMessage(
        "¡Marcaje de prueba exitoso! Sede: Sede Central",
      );
      setStatusMessage("Registro finalizado.");

      // Detener y limpiar la cámara tras el marcaje exitoso
      if (html5QrcodeRef.current && html5QrcodeRef.current.isScanning) {
        await html5QrcodeRef.current.stop();
        html5QrcodeRef.current.clear();
      }
    } catch (err: any) {
      setErrorMessage(
        err.message || "Error inesperado al registrar la asistencia.",
      );
      setStatusMessage("Apunta nuevamente al código QR.");

      // Reanudar lectura si falla el GPS en el momento del escaneo
      if (html5QrcodeRef.current) {
        html5QrcodeRef.current.resume();
      }
    } finally {
      setTimeout(() => setIsProcessing(false), 2500);
    }
  };

  // Función para reintentar la solicitud de permiso GPS en caso de rechazo manual
  const retryGpsPermission = async () => {
    setErrorMessage(null);
    setStatusMessage("Solicitando permisos de ubicación GPS...");
    try {
      await getCurrentLocation();
      setHasGpsPermission(true);
    } catch (err: any) {
      setHasGpsPermission(false);
      setErrorMessage(
        err.message || "Es necesario dar permisos de ubicación para continuar.",
      );
    }
  };

  // Estado de carga inicial mientras valida sesión y solicita GPS
  if (isInitializing) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900 text-white">
        <p className="animate-pulse font-medium text-center px-4">
          Cargando entorno y verificando permisos GPS...
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-between min-h-screen bg-slate-900 text-slate-100 p-4">
      {/* Header del Usuario */}
      <header className="w-full max-w-md flex justify-between items-center py-4 border-b border-slate-800">
        <div>
          <h1 className="text-lg font-bold text-white">{session?.name}</h1>
          <p className="text-xs text-slate-400 capitalize">
            Empleado / {session?.role}
          </p>
        </div>
        <button
          onClick={() => {
            if (html5QrcodeRef.current && html5QrcodeRef.current.isScanning) {
              html5QrcodeRef.current.stop().then(() => {
                localStorage.removeItem("user_session");
                onNavigateToLogin();
              });
            } else {
              localStorage.removeItem("user_session");
              onNavigateToLogin();
            }
          }}
          className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg border border-slate-700 transition"
        >
          Cerrar Sesión
        </button>
      </header>

      {/* Visor del Escáner QR */}
      <main className="w-full max-w-md flex flex-col items-center my-auto">
        <div className="relative w-full bg-black rounded-2xl overflow-hidden border-2 border-slate-700 shadow-2xl min-h-[300px] flex items-center justify-center">
          <div id={scannerContainerId} className="w-full h-full" />

          {/* Bloqueo si no se ha concedido el permiso GPS */}
          {!hasGpsPermission && !isInitializing && (
            <div className="absolute inset-0 bg-slate-950 p-6 flex flex-col items-center justify-center text-center gap-4 z-10">
              <span className="text-4xl">📍</span>
              <p className="text-sm text-slate-300">
                Se requiere acceso a la ubicación GPS para activar la cámara y registrar tu asistencia.
              </p>
              <button
                onClick={retryGpsPermission}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs px-4 py-2.5 rounded-xl transition shadow-lg"
              >
                Conceder Permiso GPS
              </button>
            </div>
          )}

          {/* Overlay Bloqueador durante peticiones */}
          {isProcessing && (
            <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center gap-3 p-4 text-center z-20">
              <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm font-medium text-indigo-300">
                {statusMessage}
              </p>
            </div>
          )}
        </div>

        {/* Notificaciones y Estados */}
        <div className="w-full mt-4 text-center">
          {!errorMessage && !successMessage && (
            <p className="text-sm text-slate-400">{statusMessage}</p>
          )}

          {errorMessage && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-sm">
              {errorMessage}
            </div>
          )}

          {successMessage && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3 rounded-xl text-sm font-medium">
              {successMessage}
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-md text-center py-4 text-xs text-slate-500">
        Ubicación GPS obligatoria al escanear (MODO TEST)
      </footer>
    </div>
  );
};