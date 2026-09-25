import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Printer, Building2, MapPin, QrCode, RefreshCw } from "lucide-react";

interface DependenciaQR {
  id: string;
  nombre: string;
  ubicacion: string;
  qrToken: string;
}

const MOCK_DEPENDENCIAS: DependenciaQR[] = [
  {
    id: "1",
    nombre: "Sede Principal - Alcaldía",
    ubicacion: "San José de Guanipa",
    qrToken: "DEP_ALCALDIA_89F2A1",
  },
  {
    id: "2",
    nombre: "Dirección de Hacienda",
    ubicacion: "El Tigre",
    qrToken: "DEP_HACIENDA_3C4D1E",
  },
];

export default function PrintableQRCard() {
  const [dependencias] = useState<DependenciaQR[]>(MOCK_DEPENDENCIAS);
  const [selectedDep, setSelectedDep] = useState<DependenciaQR>(
    MOCK_DEPENDENCIAS[0],
  );

  // 1. Dominio de producción (Siempre usar HTTPS explícito)
  const productionDomain = "https://qr-asistencia-kappa.vercel.app";

  // 2. Construcción limpia del enlace sin slashes dobles ni caracteres invisibles
  const getCleanBaseUrl = () => {
    if (typeof window === "undefined") return productionDomain;

    const origin = window.location.origin;

    // Si estamos en entorno local, forzar la URL pública desplegada en Vercel
    if (origin.includes("localhost") || origin.includes("127.0.0.1")) {
      return productionDomain;
    }

    // Si la App está corriendo en red local por IP (ej: 192.168.1.50)
    if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/.test(window.location.hostname)) {
      return `http://${window.location.host}`;
    }

    return origin;
  };

  const baseUrl = getCleanBaseUrl();
  // Formato estricto de URL para que la cámara del smartphone lance el banner de sitio web
  const fullQrUrl = `${baseUrl.replace(/\/+$/, "")}/marcar?token=${encodeURIComponent(selectedDep.qrToken)}`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* HEADER - No se imprime */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <QrCode className="h-7 w-7 text-indigo-600" />
            Puntos de Control QR
          </h1>
          <p className="text-sm text-slate-500">
            Genera e imprime los carnets o carteles QR para el marcaje de
            asistencia en cada dependencia.
          </p>
        </div>

        <button
          onClick={handlePrint}
          className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl font-medium shadow-md shadow-indigo-600/20 transition-all"
        >
          <Printer className="h-4 w-4" />
          Imprimir Punto QR
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* PANEL DE SELECCIÓN DE DEPENDENCIA - No se imprime */}
        <div className="lg:col-span-1 space-y-3 print:hidden">
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">
            Seleccionar Dependencia
          </h2>

          <div className="space-y-2">
            {dependencias.map((dep) => (
              <button
                key={dep.id}
                onClick={() => setSelectedDep(dep)}
                className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-start gap-3 ${
                  selectedDep.id === dep.id
                    ? "bg-indigo-50/60 border-indigo-500 text-indigo-900 shadow-sm"
                    : "bg-white border-slate-200 text-slate-700 hover:border-slate-300"
                }`}
              >
                <div
                  className={`p-2 rounded-lg ${selectedDep.id === dep.id ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-500"}`}
                >
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm leading-tight">
                    {dep.nombre}
                  </h3>
                  <span className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                    <MapPin className="h-3 w-3" /> {dep.ubicacion}
                  </span>
                </div>
              </button>
            ))}
          </div>

          {/* Información del URL y Token */}
          <div className="p-4 bg-slate-900 text-slate-300 rounded-xl space-y-2 text-xs">
            <div className="flex items-center justify-between text-slate-400 font-mono">
              <span>URL DEL ENLACE QR</span>
              <button className="hover:text-white flex items-center gap-1">
                <RefreshCw className="h-3 w-3" /> Actualizar
              </button>
            </div>
            <p className="font-mono bg-slate-800 p-2 rounded text-indigo-400 border border-slate-700 break-all">
              {fullQrUrl}
            </p>
          </div>
        </div>

        {/* VISTA PREVIA Y PLANTILLA DE IMPRESIÓN */}
        <div className="lg:col-span-2 flex justify-center items-start">
          <div className="w-full max-w-md bg-white border-2 border-slate-800 rounded-2xl p-8 shadow-xl text-center space-y-6 print:border-2 print:border-black print:shadow-none print:w-full print:max-w-none">
            {/* Encabezado Institucional */}
            <div className="space-y-1.5 border-b border-slate-200 pb-4">
              <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest block print:text-black">
                Control de Asistencia Biométrico / GPS
              </span>
              <h2 className="text-xl font-extrabold text-slate-900 leading-tight">
                {selectedDep.nombre}
              </h2>
              <p className="text-xs text-slate-500 flex items-center justify-center gap-1">
                <MapPin className="h-3.5 w-3.5 text-indigo-500 print:text-black" />
                {selectedDep.ubicacion}
              </p>
            </div>

            {/* Código QR Generado como URL */}
            <div className="p-4 bg-white rounded-xl inline-block border border-slate-200 shadow-inner print:border-none print:p-0">
              <QRCodeSVG
                value={fullQrUrl}
                size={220}
                level="M" // Corrección de error 'M' óptima para detección rápida de URL
                includeMargin={true}
                bgColor="#FFFFFF"
                fgColor="#000000"
              />
            </div>

            {/* Instrucciones de Uso */}
            <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-100 print:bg-transparent print:border-black">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                ¿Cómo registrar tu asistencia?
              </h4>
              <ol className="text-xs text-slate-600 text-left space-y-1 list-decimal list-inside">
                <li>
                  Abre la <strong>cámara</strong> de tu teléfono inteligente.
                </li>
                <li>Apunta al código QR para escanear el enlace web.</li>
                <li>Inicia sesión si aún no lo has hecho.</li>
                <li>
                  Verifica que tu <strong>ubicación GPS</strong> esté activada.
                </li>
              </ol>
            </div>

            {/* Pie de página */}
            <div className="pt-2 text-[10px] text-slate-400 font-mono flex items-center justify-between border-t border-slate-100">
              <span>Token: {selectedDep.qrToken}</span>
              <span>Punto Oficial de Control</span>
            </div>
          </div>
        </div>
      </div>

      {/* REGLAS CSS PARA LIMPIAR PÁGINA EN IMPRESIÓN */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .lg\\:col-span-2, .lg\\:col-span-2 * {
            visibility: visible;
          }
          .lg\\:col-span-2 {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            display: flex;
            justify-content: center;
            align-items: center;
          }
        }
      `}</style>
    </div>
  );
}