import { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  Printer,
  Building2,
  MapPin,
  QrCode,
  RefreshCw,
  Loader2,
  Check,
  Copy,
} from "lucide-react";
import { supabase } from "../utils/supabaseClient";

interface DependenciaQR {
  id: string;
  nombre: string;
  ubicacion: string;
  qrToken: string;
}

export default function PrintableQRCard() {
  const [dependencias, setDependencias] = useState<DependenciaQR[]>([]);
  const [selectedDep, setSelectedDep] = useState<DependenciaQR | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [updatingToken, setUpdatingToken] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  const productionDomain = "https://qr-asistencia-kappa.vercel.app";

  const fetchDependencias = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("dependencias")
        .select("id, name, qr_token")
        .order("name", { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        const formatted: DependenciaQR[] = data.map((item) => ({
          id: item.id,
          nombre: item.name || "Sede Sin Nombre",
          ubicacion: item.address || "El Tigrito",
          qrToken: item.qr_token || `DEP_${item.id.slice(0, 8)}`,
        }));

        setDependencias(formatted);
        setSelectedDep((prev) =>
          prev ? formatted.find((d) => d.id === prev.id) || formatted[0] : formatted[0]
        );
      }
    } catch (err) {
      console.error("Error al cargar sedes para QR:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDependencias();
  }, []);

  const getCleanBaseUrl = () => {
    if (typeof window === "undefined") return productionDomain;
    const origin = window.location.origin;

    if (origin.includes("localhost") || origin.includes("127.0.0.1")) {
      return productionDomain;
    }

    if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/.test(window.location.hostname)) {
      return `http://${window.location.host}`;
    }

    return origin;
  };

  const baseUrl = getCleanBaseUrl();
  const fullQrUrl = selectedDep
    ? `${baseUrl.replace(/\/+$/, "")}/marcar?token=${encodeURIComponent(selectedDep.qrToken)}`
    : "";

  const handleRegenerateToken = async () => {
    if (!selectedDep) return;

    const confirmChange = window.confirm(
      `¿Deseas invalidar el código QR actual de "${selectedDep.nombre}" y generar uno nuevo? Los carteles impresos anteriormente dejarán de funcionar.`
    );

    if (!confirmChange) return;

    setUpdatingToken(true);
    try {
      const newToken = `DEP_${Math.random().toString(36).substring(2, 8).toUpperCase()}_${Date.now().toString().slice(-4)}`;

      const { error } = await supabase
        .from("dependencias")
        .update({ qr_token: newToken })
        .eq("id", selectedDep.id);

      if (error) throw error;

      setSelectedDep((prev) => (prev ? { ...prev, qrToken: newToken } : null));
      setDependencias((prev) =>
        prev.map((d) => (d.id === selectedDep.id ? { ...d, qrToken: newToken } : d))
      );
    } catch (err: any) {
      alert("Error al actualizar token: " + err.message);
    } finally {
      setUpdatingToken(false);
    }
  };

  const handleCopyUrl = () => {
    if (!fullQrUrl) return;
    navigator.clipboard.writeText(fullQrUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="p-12 flex flex-col items-center justify-center gap-2 text-slate-400 min-h-100">
        <Loader2 className="h-7 w-7 animate-spin text-indigo-600" />
        <span className="text-xs font-medium">Cargando puntos de control QR...</span>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* HEADER - Se oculta en impresión */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <QrCode className="h-7 w-7 text-indigo-600" />
            Puntos de Control QR
          </h1>
          <p className="text-sm text-slate-500">
            Genera e imprime los carteles oficiales QR para el marcaje de asistencia.
          </p>
        </div>

        <button
          onClick={handlePrint}
          disabled={!selectedDep}
          className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl font-medium shadow-md shadow-indigo-600/20 transition-all disabled:opacity-50"
        >
          <Printer className="h-4 w-4" />
          Imprimir Punto QR
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* PANEL LATERAL DE SELECCIÓN */}
        <div className="lg:col-span-1 space-y-4 print:hidden">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Seleccionar Dependencia
          </h2>

          <div className="space-y-2 max-h-95 overflow-y-auto pr-1">
            {dependencias.map((dep) => (
              <button
                key={dep.id}
                onClick={() => setSelectedDep(dep)}
                className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-start gap-3 ${
                  selectedDep?.id === dep.id
                    ? "bg-indigo-50/70 border-indigo-500 text-indigo-900 shadow-sm"
                    : "bg-white border-slate-200 text-slate-700 hover:border-slate-300"
                }`}
              >
                <div
                  className={`p-2 rounded-lg shrink-0 ${
                    selectedDep?.id === dep.id
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  <Building2 className="h-5 w-5" />
                </div>
                <div className="overflow-hidden">
                  <h3 className="font-semibold text-sm leading-tight truncate">
                    {dep.nombre}
                  </h3>
                  <span className="text-xs text-slate-500 flex items-center gap-1 mt-1 truncate">
                    <MapPin className="h-3 w-3 shrink-0" /> {dep.ubicacion}
                  </span>
                </div>
              </button>
            ))}
          </div>

          {selectedDep && (
            <div className="p-4 bg-slate-900 text-slate-300 rounded-xl space-y-3 text-xs shadow-lg">
              <div className="flex items-center justify-between text-slate-400 font-mono">
                <span>ENLACE QR OFICIAL</span>
                <button
                  onClick={handleRegenerateToken}
                  disabled={updatingToken}
                  className="hover:text-amber-400 text-slate-400 flex items-center gap-1 transition-colors disabled:opacity-50"
                  title="Generar un nuevo token para invalidar el anterior"
                >
                  <RefreshCw
                    className={`h-3 w-3 ${updatingToken ? "animate-spin text-amber-400" : ""}`}
                  />
                  <span>Regenerar</span>
                </button>
              </div>

              <div className="relative">
                <p className="font-mono bg-slate-950 p-2.5 pr-8 rounded-lg text-indigo-400 border border-slate-800 break-all text-[11px]">
                  {fullQrUrl}
                </p>
                <button
                  onClick={handleCopyUrl}
                  className="absolute right-2 top-2.5 text-slate-400 hover:text-white"
                  title="Copiar URL"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-emerald-400" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* VISTA PREVIA Y CARTELES */}
        {selectedDep ? (
          <div className="lg:col-span-2 flex justify-center items-start print:block print:w-full">
            <div id="printable-card" className="qr-print-card w-full max-w-md bg-white border-2 border-slate-800 rounded-2xl p-8 shadow-xl text-center space-y-6">
              {/* Encabezado */}
              <div className="space-y-1.5 border-b-2 border-slate-200 pb-4">
                <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest block print:text-black">
                  Control de Asistencia Biométrico / GPS
                </span>
                <h2 className="text-xl font-black text-slate-900 leading-tight">
                  {selectedDep.nombre}
                </h2>
                <p className="text-xs font-semibold text-slate-600 flex items-center justify-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-indigo-600 print:text-black" />
                  {selectedDep.ubicacion}
                </p>
              </div>

              {/* QR Renderizado vectorial */}
              <div className="py-2 flex justify-center items-center">
                <div className="p-3 bg-white border-2 border-slate-900 rounded-2xl inline-block print:border-2">
                  <QRCodeSVG
                    value={fullQrUrl}
                    size={240}
                    level="H"
                    includeMargin={false}
                    bgColor="#FFFFFF"
                    fgColor="#000000"
                    style={{ shapeRendering: "crispEdges" }}
                  />
                </div>
              </div>

              {/* Instrucciones */}
              <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200 print:bg-white print:border-slate-900 text-left">
                <h4 className="text-[11px] font-bold text-slate-900 uppercase tracking-wide text-center">
                  ¿Cómo registrar tu asistencia?
                </h4>
                <ol className="text-xs text-slate-700 space-y-1 list-decimal list-inside font-medium">
                  <li>Abre la <strong>cámara</strong> de tu teléfono móvil.</li>
                  <li>Apunta al código QR para abrir el enlace.</li>
                  <li>Inicia sesión si aún no estás identificado.</li>
                  <li>Asegúrate de mantener activo tu <strong>GPS</strong>.</li>
                </ol>
              </div>

              {/* Footer */}
              <div className="pt-2 text-[10px] text-slate-500 font-mono flex items-center justify-between border-t border-slate-200">
                <span>ID: {selectedDep.qrToken}</span>
                <span className="font-bold">PUNTOS DE CONTROL OFICIAL</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="lg:col-span-2 flex items-center justify-center p-12 bg-white rounded-2xl border border-slate-200 text-slate-400 text-xs">
            No hay sedes seleccionadas.
          </div>
        )}
      </div>

      {/* ESTILOS DE IMPRESIÓN HD PREDETERMINADOS */}
      <style>{`
        @media print {
          @page {
            size: letter portrait;
            margin: 0;
          }
          
          /* Ocultar todo el documento */
          html, body {
            background: #ffffff !important;
            margin: 0 !important;
            padding: 0 !important;
            height: 100%;
            overflow: hidden;
          }
          
          body * {
            visibility: hidden;
          }

          /* Mostrar únicamente la tarjeta de control */
          #printable-card, #printable-card * {
            visibility: visible;
          }

          #printable-card {
            position: absolute !important;
            top: 2cm !important;
            left: 50% !important;
            transform: translateX(-50%) !important;
            width: 12cm !important;
            max-width: 12cm !important;
            margin: 0 auto !important;
            padding: 0.8cm !important;
            border: 3px solid #000000 !important;
            border-radius: 1rem !important;
            box-shadow: none !important;
            background: #ffffff !important;
          }

          /* Forzar renderizado en blanco y negro puro */
          .qr-print-card {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>
    </div>
  );
}