import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Line,
  ComposedChart,
  Cell,
  Legend,
} from "recharts";
import { TrendingUp, TrendingDown, Clock, Printer, UserCheck } from "lucide-react";

interface MonthlyData {
  month: string;
  timeMinutes: number; // Minutos desde las 7:00 AM (ej: 60 = 8:00 AM)
  timeLabel: string;   // Formato legible (ej: "8:05 a.m.")
}

interface EmployeeReport {
  id: string;
  name: string;
  augustEstimateMinutes: number;
  months: MonthlyData[];
}

const MONTH_COLORS: Record<string, string> = {
  Enero: "#3B82F6",   // Azul
  Febrero: "#EF4444", // Rojo
  Marzo: "#F59E0B",   // Amarillo
  Abril: "#10B981",   // Verde
  Mayo: "#8B5CF6",    // Morado
  Junio: "#06B6D4",   // Cyan
  Julio: "#64748B",   // Slate/Gris
};

const EMPLOYEES_REPORT_DATA: EmployeeReport[] = [
  {
    id: "1",
    name: "Miguel Peña",
    augustEstimateMinutes: 62,
    months: [
      { month: "Enero", timeMinutes: 55, timeLabel: "7:55 a.m." },
      { month: "Febrero", timeMinutes: 58, timeLabel: "7:58 a.m." },
      { month: "Marzo", timeMinutes: 60, timeLabel: "8:00 a.m." },
      { month: "Abril", timeMinutes: 62, timeLabel: "8:02 a.m." },
      { month: "Mayo", timeMinutes: 65, timeLabel: "8:05 a.m." },
    ],
  },
  {
    id: "2",
    name: "Jesús Rodríguez",
    augustEstimateMinutes: 70,
    months: [
      { month: "Enero", timeMinutes: 50, timeLabel: "7:50 a.m." },
      { month: "Febrero", timeMinutes: 60, timeLabel: "8:00 a.m." },
      { month: "Marzo", timeMinutes: 65, timeLabel: "8:05 a.m." },
      { month: "Abril", timeMinutes: 70, timeLabel: "8:10 a.m." },
      { month: "Mayo", timeMinutes: 75, timeLabel: "8:15 a.m." },
    ],
  },
  {
    id: "3",
    name: "Karelis Velásquez",
    augustEstimateMinutes: 65,
    months: [
      { month: "Enero", timeMinutes: 45, timeLabel: "7:45 a.m." },
      { month: "Febrero", timeMinutes: 50, timeLabel: "7:50 a.m." },
      { month: "Marzo", timeMinutes: 55, timeLabel: "7:55 a.m." },
      { month: "Abril", timeMinutes: 60, timeLabel: "8:00 a.m." },
      { month: "Mayo", timeMinutes: 65, timeLabel: "8:05 a.m." },
    ],
  },
  {
    id: "4",
    name: "Marivir Torres",
    augustEstimateMinutes: 48,
    months: [
      { month: "Enero", timeMinutes: 60, timeLabel: "8:00 a.m." },
      { month: "Febrero", timeMinutes: 58, timeLabel: "7:58 a.m." },
      { month: "Marzo", timeMinutes: 55, timeLabel: "7:55 a.m." },
      { month: "Abril", timeMinutes: 52, timeLabel: "7:52 a.m." },
      { month: "Mayo", timeMinutes: 50, timeLabel: "7:50 a.m." },
    ],
  },
  {
    id: "5",
    name: "Juan C. Martínez",
    augustEstimateMinutes: 50,
    months: [
      { month: "Enero", timeMinutes: 70, timeLabel: "8:10 a.m." },
      { month: "Febrero", timeMinutes: 65, timeLabel: "8:05 a.m." },
      { month: "Marzo", timeMinutes: 60, timeLabel: "8:00 a.m." },
      { month: "Abril", timeMinutes: 55, timeLabel: "7:55 a.m." },
      { month: "Mayo", timeMinutes: 52, timeLabel: "7:52 a.m." },
    ],
  },
  {
    id: "6",
    name: "Gabriel Landaeux",
    augustEstimateMinutes: 70,
    months: [
      { month: "Enero", timeMinutes: 105, timeLabel: "8:45 a.m." },
      { month: "Febrero", timeMinutes: 90, timeLabel: "8:30 a.m." },
      { month: "Marzo", timeMinutes: 80, timeLabel: "8:20 a.m." },
      { month: "Abril", timeMinutes: 75, timeLabel: "8:15 a.m." },
      { month: "Mayo", timeMinutes: 70, timeLabel: "8:10 a.m." },
    ],
  },
  {
    id: "7",
    name: "Roger Ramos",
    augustEstimateMinutes: 85,
    months: [
      { month: "Enero", timeMinutes: 50, timeLabel: "7:50 a.m." },
      { month: "Febrero", timeMinutes: 60, timeLabel: "8:00 a.m." },
      { month: "Marzo", timeMinutes: 70, timeLabel: "8:10 a.m." },
      { month: "Abril", timeMinutes: 80, timeLabel: "8:20 a.m." },
      { month: "Mayo", timeMinutes: 90, timeLabel: "8:30 a.m." },
    ],
  },
  {
    id: "8",
    name: "John Szabo",
    augustEstimateMinutes: 58,
    months: [
      { month: "Junio", timeMinutes: 50, timeLabel: "7:50 a.m." },
      { month: "Julio", timeMinutes: 58, timeLabel: "7:58 a.m." },
    ],
  },
];

// Helper: Formatear minutos a HH:MM AM/PM
const formatMinutesToTime = (totalMinutes: number) => {
  const hours = Math.floor(totalMinutes / 60) + 7;
  const mins = Math.round(totalMinutes % 60);
  const period = hours >= 12 ? "p.m." : "a.m.";
  const formattedHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
  return `${formattedHours}:${mins < 10 ? "0" : ""}${mins} ${period}`;
};

export default function AttendanceReportSheet() {
  const handlePrint = () => {
    window.print();
  };

  // Preparación y cálculo dinámico de métricas por empleado
  const processedData = useMemo(() => {
    return EMPLOYEES_REPORT_DATA.map((emp) => {
      const totalMinutes = emp.months.reduce((acc, m) => acc + m.timeMinutes, 0);
      const avgMinutes = totalMinutes / emp.months.length;
      const firstMonth = emp.months[0].timeMinutes;
      const lastMonth = emp.months[emp.months.length - 1].timeMinutes;

      // Si la hora de llegada aumentó con el tiempo, hubo "relajación" (llegó más tarde)
      const trend: "relajacion" | "mejora" = lastMonth > firstMonth ? "relajacion" : "mejora";

      return {
        ...emp,
        avgMinutes,
        avgTimeLabel: formatMinutesToTime(avgMinutes),
        trend,
      };
    });
  }, []);

  // Formatear datos para el gráfico principal agrupado
  const mainChartData = useMemo(() => {
    return processedData.map((emp) => {
      const row: Record<string, any> = { name: emp.name };
      emp.months.forEach((m) => {
        row[m.month] = m.timeMinutes;
      });
      return row;
    });
  }, [processedData]);

  return (
    <div className="p-8 bg-slate-50 min-h-screen text-slate-900 font-sans print:p-0 print:bg-white">
      {/* Estilos específicos de impresión */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; font-size: 11px; }
          .page-break { page-break-inside: avoid; }
          .print-card { border: 1px solid #cbd5e1 !important; box-shadow: none !important; }
        }
      `}</style>

      {/* HEADER DE ACCIONES (SOLO EN PANTALLA) */}
      <div className="flex justify-between items-center mb-6 no-print bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Clock className="h-5 w-5 text-indigo-600" />
            Reporte de Promedios de Asistencia (Enero - Julio 2026)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Vista de tendencias de puntualidad, comparativa mensual y estimaciones proyectadas.
          </p>
        </div>
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 active:bg-indigo-800 transition-all shadow-sm"
        >
          <Printer className="h-4 w-4" /> Imprimir Reporte
        </button>
      </div>

      {/* CONTENEDOR IMPRESO / PRINCIPAL */}
      <div className="max-w-6xl mx-auto bg-white p-6 rounded-xl border border-slate-200 shadow-sm print:shadow-none print:border-none print:p-0">
        <div className="text-center mb-6 border-b border-slate-200 pb-3">
          <h2 className="text-base font-bold uppercase tracking-wider text-slate-800 flex items-center justify-center gap-2">
            <UserCheck className="h-5 w-5 text-slate-600 print:hidden" />
            Promedios de Asistencia (Enero - Julio 2026)
          </h2>
        </div>

        {/* 1. GRÁFICO SUPERIOR BARRAS HORIZONTALES */}
        <div className="border border-slate-200 rounded-lg p-4 mb-6 bg-slate-50/50 print-card print:bg-transparent">
          <h3 className="text-xs font-semibold text-slate-600 mb-3 uppercase tracking-wider">
            Comparativa Mensual General
          </h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={mainChartData}
                margin={{ top: 10, right: 30, left: 90, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                <XAxis
                  type="number"
                  domain={[30, 110]}
                  tickFormatter={formatMinutesToTime}
                  ticks={[40, 60, 80, 100]}
                  tick={{ fontSize: 11, fill: "#64748B" }}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fill: "#334155", fontSize: 11, fontWeight: 500 }}
                  width={110}
                />
                <Tooltip
                  formatter={(val: number) => [formatMinutesToTime(val), "Hora de llegada"]}
                  contentStyle={{ borderRadius: "8px", border: "1px solid #E2E8F0" }}
                />
                <Legend wrapperStyle={{ paddingTop: "10px", fontSize: "12px" }} />
                {Object.keys(MONTH_COLORS).map((month) => (
                  <Bar
                    key={month}
                    dataKey={month}
                    name={month}
                    fill={MONTH_COLORS[month]}
                    radius={[0, 2, 2, 0]}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 2. GRID INDIVIDUAL POR EMPLEADO */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6 print:grid-cols-3 print:gap-3">
          {processedData.map((emp) => (
            <div
              key={emp.id}
              className="border border-slate-200 rounded-lg p-3 bg-white relative flex flex-col justify-between shadow-sm print-card page-break"
            >
              <div className="flex justify-between items-center mb-2 pb-1 border-b border-slate-100">
                <span className="font-bold text-xs text-slate-800">{emp.name}</span>
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    emp.trend === "relajacion"
                      ? "bg-rose-50 text-rose-700 border border-rose-200"
                      : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  }`}
                >
                  {emp.trend === "relajacion" ? "Relajación" : "Mejora"}
                </span>
              </div>

              {/* Micro Gráfico Combinado */}
              <div className="h-40 w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart
                    data={emp.months}
                    margin={{ top: 15, right: 10, left: -25, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="2 2" vertical={false} stroke="#F1F5F9" />
                    <XAxis dataKey="month" hide />
                    <YAxis
                      domain={[30, 105]}
                      tickFormatter={formatMinutesToTime}
                      tick={{ fontSize: 9, fill: "#94A3B8" }}
                    />
                    <Tooltip
                      formatter={(val: number) => [
                        formatMinutesToTime(val),
                        "Llegada",
                      ]}
                    />

                    {/* Línea Horizontal Estimado Agosto */}
                    <ReferenceLine
                      y={emp.augustEstimateMinutes}
                      stroke="#0F172A"
                      strokeWidth={1.5}
                      strokeDasharray="3 3"
                    />

                    {/* Barras de Meses (Corregido <Cell />) */}
                    <Bar dataKey="timeMinutes" barSize={16}>
                      {emp.months.map((entry) => (
                        <Cell
                          key={`cell-${entry.month}`}
                          fill={MONTH_COLORS[entry.month] || "#94A3B8"}
                        />
                      ))}
                    </Bar>

                    {/* Línea de Tendencia */}
                    <Line
                      type="monotone"
                      dataKey="timeMinutes"
                      stroke={emp.trend === "relajacion" ? "#E11D48" : "#059669"}
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>

                {/* Hora Promedio Prominente */}
                <div className="absolute bottom-1 right-2 pointer-events-none text-right">
                  <span className="text-[10px] block text-slate-400 font-medium -mb-1">
                    PROMEDIO
                  </span>
                  <span className="text-2xl font-black text-slate-400/70 font-mono tracking-tight">
                    {emp.avgTimeLabel}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 3. LEYENDA PIE DE PÁGINA */}
        <div className="border-t border-slate-300 pt-4 mt-6 flex flex-wrap justify-center items-center gap-8 text-xs font-medium text-slate-700 print:pt-2 print:mt-2">
          <span className="font-bold text-slate-900">Leyenda de Simbología:</span>

          <div className="flex items-center gap-2">
            <div className="w-8 border-b-2 border-dashed border-black"></div>
            <span>Estimado Agosto</span>
          </div>

          <div className="flex items-center gap-1.5 text-rose-600">
            <TrendingUp className="h-4 w-4" />
            <span>Relajación (Llegada más tardía)</span>
          </div>

          <div className="flex items-center gap-1.5 text-emerald-600">
            <TrendingDown className="h-4 w-4" />
            <span>Mejora (Llegada más temprana)</span>
          </div>
        </div>
      </div>
    </div>
  );
}