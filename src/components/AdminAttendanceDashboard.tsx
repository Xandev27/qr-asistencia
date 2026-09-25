import { useState, useMemo } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from "recharts";
import {
  Calendar,
  Users,
  CheckCircle,
  AlertTriangle,
  Search,
  Filter,
  Clock,
  TrendingUp,
  TrendingDown,
  X,
  UserCheck,
  Printer,
} from "lucide-react";

// --- ESTRUCTURA DE DATOS EXPANDIDA ---
interface DailyDetail {
  day: string;
  arrivalTime: string;
  minutesDiff: number;
  status: "a_tiempo" | "tarde" | "falta";
}

interface EmployeeAttendance {
  id: string;
  name: string;
  department: string;
  attendance: number;
  presentDays: number;
  totalDays: number;
  avgArrivalTime: string;
  weeklyHistory: DailyDetail[];
}

const WEEKLY_DATA: EmployeeAttendance[] = [
  {
    id: "EMP001",
    name: "Ana García",
    department: "Ingeniería",
    attendance: 100,
    presentDays: 5,
    totalDays: 5,
    avgArrivalTime: "07:54 AM",
    weeklyHistory: [
      { day: "Lun", arrivalTime: "08:05 AM", minutesDiff: 5, status: "tarde" },
      { day: "Mar", arrivalTime: "07:58 AM", minutesDiff: -2, status: "a_tiempo" },
      { day: "Mié", arrivalTime: "07:55 AM", minutesDiff: -5, status: "a_tiempo" },
      { day: "Jue", arrivalTime: "07:50 AM", minutesDiff: -10, status: "a_tiempo" },
      { day: "Vie", arrivalTime: "07:45 AM", minutesDiff: -15, status: "a_tiempo" },
    ],
  },
  {
    id: "EMP002",
    name: "Carlos López",
    department: "Ventas",
    attendance: 80,
    presentDays: 4,
    totalDays: 5,
    avgArrivalTime: "08:18 AM",
    weeklyHistory: [
      { day: "Lun", arrivalTime: "07:55 AM", minutesDiff: -5, status: "a_tiempo" },
      { day: "Mar", arrivalTime: "08:05 AM", minutesDiff: 5, status: "tarde" },
      { day: "Mié", arrivalTime: "08:15 AM", minutesDiff: 15, status: "tarde" },
      { day: "Jue", arrivalTime: "08:30 AM", minutesDiff: 30, status: "tarde" },
      { day: "Vie", arrivalTime: "N/A", minutesDiff: 60, status: "falta" },
    ],
  },
  {
    id: "EMP003",
    name: "María Rodríguez",
    department: "Recursos Humanos",
    attendance: 60,
    presentDays: 3,
    totalDays: 5,
    avgArrivalTime: "08:25 AM",
    weeklyHistory: [
      { day: "Lun", arrivalTime: "08:00 AM", minutesDiff: 0, status: "a_tiempo" },
      { day: "Mar", arrivalTime: "08:20 AM", minutesDiff: 20, status: "tarde" },
      { day: "Mié", arrivalTime: "08:35 AM", minutesDiff: 35, status: "tarde" },
      { day: "Jue", arrivalTime: "N/A", minutesDiff: 60, status: "falta" },
      { day: "Vie", arrivalTime: "N/A", minutesDiff: 60, status: "falta" },
    ],
  },
];

export default function AdminAttendanceDashboard() {
  const [timeframe, setTimeframe] = useState<"weekly" | "monthly" | "custom">("weekly");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("ALL");
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeAttendance | null>(null);

  const currentData = WEEKLY_DATA;

  // Filtrar datos
  const filteredData = useMemo(() => {
    return currentData.filter((emp) => {
      const matchesSearch =
        emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.id.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDept =
        departmentFilter === "ALL" || emp.department === departmentFilter;
      return matchesSearch && matchesDept;
    });
  }, [currentData, searchTerm, departmentFilter]);

  // Cálculos KPIs
  const totalEmployees = filteredData.length;
  const avgAttendance = useMemo(() => {
    if (totalEmployees === 0) return 0;
    const sum = filteredData.reduce((acc, curr) => acc + curr.attendance, 0);
    return (sum / totalEmployees).toFixed(1);
  }, [filteredData, totalEmployees]);

  const lowAttendanceCount = useMemo(() => {
    return filteredData.filter((emp) => emp.attendance < 80).length;
  }, [filteredData]);

  const departments = useMemo(() => {
    const depts = new Set(currentData.map((d) => d.department));
    return ["ALL", ...Array.from(depts)];
  }, [currentData]);

  const getBarColor = (percentage: number) => {
    if (percentage >= 90) return "#10B981";
    if (percentage >= 75) return "#F59E0B";
    return "#EF4444";
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-6 w-full bg-slate-50 min-h-screen font-sans text-slate-800 print:bg-white print:p-0">
      {/* ESTILOS DE IMPRESIÓN DINÁMICOS */}
      <style>{`
        @media print {
          .no-print {
            display: none !important;
          }
          body {
            background-color: #ffffff !important;
            color: #000000 !important;
          }
          .print-full-width {
            width: 100% !important;
            max-width: none !important;
            box-shadow: none !important;
            border: none !important;
          }
          .page-break {
            page-break-before: always;
          }
        }
      `}</style>

      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4 print:mb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2 print:text-xl">
            <Users className="h-7 w-7 text-indigo-600 print:hidden" />
            Informe de Control de Asistencia
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {timeframe === "weekly" && "Reporte Semanal"}
            {timeframe === "monthly" && "Reporte Mensual"}
            {timeframe === "custom" &&
              `Reporte Personalizado (${startDate || "Inicio"} a ${endDate || "Fin"})`}
            {" • Generado el " + new Date().toLocaleDateString()}
          </p>
        </div>

        {/* SELECTOR DE PERÍODO Y BOTÓN DE IMPRESIÓN */}
        <div className="flex flex-wrap items-center gap-3 no-print">
          <div className="flex items-center bg-white border border-slate-200 rounded-lg p-1 shadow-sm">
            <button
              onClick={() => setTimeframe("weekly")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                timeframe === "weekly"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Calendar className="h-3.5 w-3.5" />
              Semanal
            </button>
            <button
              onClick={() => setTimeframe("monthly")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                timeframe === "monthly"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Calendar className="h-3.5 w-3.5" />
              Mensual
            </button>
            <button
              onClick={() => setTimeframe("custom")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                timeframe === "custom"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Calendar className="h-3.5 w-3.5" />
              Fecha a Fecha
            </button>
          </div>

          {timeframe === "custom" && (
            <div className="flex items-center gap-2 bg-white p-1.5 rounded-lg border border-slate-200 shadow-sm text-xs">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="border border-slate-200 rounded px-2 py-1 text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <span className="text-slate-400">a</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="border border-slate-200 rounded px-2 py-1 text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          )}

          <button
            onClick={handlePrint}
            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
          >
            <Printer className="h-4 w-4" />
            Imprimir Informe
          </button>
        </div>
      </div>

      {/* TARJETAS DE KPIS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 print:grid-cols-4 print:gap-4 print:mb-6">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4 print:p-3">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg print:hidden">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total Empleados
            </p>
            <p className="text-2xl font-bold text-slate-900 print:text-lg">{totalEmployees}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4 print:p-3">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg print:hidden">
            <CheckCircle className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Asistencia Promedio
            </p>
            <p className="text-2xl font-bold text-slate-900 print:text-lg">{avgAttendance}%</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4 print:p-3">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg print:hidden">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Hora Entrada Oficial
            </p>
            <p className="text-2xl font-bold text-slate-900 print:text-lg">08:00 AM</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4 print:p-3">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-lg print:hidden">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Asistencia Crítica (&lt;80%)
            </p>
            <p className="text-2xl font-bold text-slate-900 print:text-lg">{lowAttendanceCount}</p>
          </div>
        </div>
      </div>

      {/* BÚSQUEDA Y FILTROS (SE OCULTAN EN IMPRESIÓN) */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6 flex flex-col md:flex-row gap-4 justify-between no-print">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nombre o ID de empleado..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-400" />
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="border border-slate-200 rounded-lg text-sm p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          >
            {departments.map((dept) => (
              <option key={dept} value={dept}>
                {dept === "ALL" ? "Todos los Departamentos" : dept}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* GRÁFICO GENERAL DE ASISTENCIA */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mb-8 print:p-2 print:border-none">
        <h2 className="text-lg font-semibold text-slate-900 mb-4 print:text-base print:mb-2">
          Porcentaje de Asistencia por Empleado
        </h2>
        <div className="h-80 w-full print:h-60">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={filteredData} margin={{ top: 20, right: 30, left: 0, bottom: 25 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis dataKey="name" tick={{ fill: "#64748B", fontSize: 12 }} interval={0} angle={-15} textAnchor="end" />
              <YAxis domain={[0, 100]} unit="%" tick={{ fill: "#64748B", fontSize: 12 }} />
              <Tooltip formatter={(value) => [`${value}%`, "Asistencia"]} />
              <ReferenceLine y={90} label={{ value: "Meta (90%)", fill: "#10B981", position: "top" }} stroke="#10B981" strokeDasharray="4 4" />
              <Bar dataKey="attendance" radius={[4, 4, 0, 0]}>
                {filteredData.map((entry) => (
                  <Cell key={`cell-${entry.id}`} fill={getBarColor(entry.attendance)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* TABLA PRINCIPAL CON MÉTRICA DE HORA DE LLEGADA */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-8 print:border-slate-300">
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center print:px-2 print:py-2">
          <h2 className="text-lg font-semibold text-slate-900 print:text-base">
            Detalle Individual de Empleados
          </h2>
          <span className="text-xs text-slate-500 no-print">
            Haz clic en un empleado para ver la gráfica de puntualidad
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 print:text-xs">
            <thead className="bg-slate-50 text-slate-700 font-semibold uppercase text-xs border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 print:px-2 print:py-1">ID</th>
                <th className="px-6 py-3 print:px-2 print:py-1">Empleado</th>
                <th className="px-6 py-3 print:px-2 print:py-1">Departamento</th>
                <th className="px-6 py-3 text-center print:px-2 print:py-1">Hora Prom. Llegada</th>
                <th className="px-6 py-3 text-center print:px-2 print:py-1">Días Asistidos</th>
                <th className="px-6 py-3 text-center print:px-2 print:py-1">% Asistencia</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredData.map((emp) => (
                <tr
                  key={emp.id}
                  onClick={() => setSelectedEmployee(emp)}
                  className="hover:bg-indigo-50/50 cursor-pointer transition-colors"
                >
                  <td className="px-6 py-4 font-mono text-xs print:px-2 print:py-2">{emp.id}</td>
                  <td className="px-6 py-4 font-medium text-slate-900 print:px-2 print:py-2">{emp.name}</td>
                  <td className="px-6 py-4 print:px-2 print:py-2">{emp.department}</td>
                  <td className="px-6 py-4 text-center font-mono font-medium text-slate-700 print:px-2 print:py-2">
                    <span className="inline-flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-md print:bg-transparent print:p-0">
                      <Clock className="h-3.5 w-3.5 text-indigo-600 no-print" />
                      {emp.avgArrivalTime}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center print:px-2 print:py-2">{emp.presentDays} / {emp.totalDays}</td>
                  <td className="px-6 py-4 text-center font-semibold print:px-2 print:py-2">{emp.attendance}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL / SECCIÓN DE DETALLE DE TENDENCIA (OCULTO EN IMPRESIÓN GENERAL) */}
      {selectedEmployee && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 no-print">
          <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-lg">
                  <UserCheck className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">{selectedEmployee.name}</h3>
                  <p className="text-xs text-slate-400">
                    {selectedEmployee.department} • Hora Promedio: {selectedEmployee.avgArrivalTime}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedEmployee(null)}
                className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-slate-800 uppercase tracking-wider">
                    Curva de Puntualidad Semanal
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Mide la desviación en minutos respecto a la hora de entrada objetivo (8:00 AM).
                  </p>
                </div>
                {/* Indicador de Mejora o Relajo */}
                {selectedEmployee.weeklyHistory[0].minutesDiff >
                selectedEmployee.weeklyHistory[4].minutesDiff ? (
                  <span className="flex items-center gap-1 text-xs font-semibold bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full">
                    <TrendingUp className="h-4 w-4" /> Tendencia: Mejora
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs font-semibold bg-rose-100 text-rose-800 px-3 py-1 rounded-full">
                    <TrendingDown className="h-4 w-4" /> Tendencia: Descuido / Relajo
                  </span>
                )}
              </div>

              {/* Gráfico de Línea de Puntualidad */}
              <div className="h-64 w-full bg-slate-50 p-4 rounded-xl border border-slate-200">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={selectedEmployee.weeklyHistory}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#CBD5E1" />
                    <XAxis dataKey="day" tick={{ fill: "#475569", fontSize: 12 }} />
                    <YAxis
                      unit=" min"
                      tick={{ fill: "#475569", fontSize: 12 }}
                      label={{
                        value: "Retraso (+min) / Temprano (-min)",
                        angle: -90,
                        position: "insideLeft",
                        fill: "#64748B",
                        fontSize: 10,
                      }}
                    />
                    <Tooltip
                      formatter={(val: any) => [
                        val > 0 ? `+${val} min de retraso` : `${val} min a tiempo`,
                        "Diferencia",
                      ]}
                    />
                    <ReferenceLine
                      y={0}
                      stroke="#10B981"
                      strokeDasharray="3 3"
                      label={{ value: "8:00 AM (A tiempo)", fill: "#10B981", fontSize: 10 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="minutesDiff"
                      name="Minutos respecto a las 8:00 AM"
                      stroke="#6366F1"
                      strokeWidth={3}
                      dot={{ r: 5, fill: "#4F46E5" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Desglose Diario */}
              <div className="grid grid-cols-5 gap-2 text-center text-xs">
                {selectedEmployee.weeklyHistory.map((item) => (
                  <div
                    key={item.day}
                    className={`p-3 rounded-xl border ${
                      item.status === "a_tiempo"
                        ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                        : item.status === "tarde"
                        ? "bg-amber-50 border-amber-200 text-amber-900"
                        : "bg-rose-50 border-rose-200 text-rose-900"
                    }`}
                  >
                    <p className="font-bold text-slate-700">{item.day}</p>
                    <p className="font-mono mt-1 text-sm font-semibold">{item.arrivalTime}</p>
                    <p className="text-[10px] uppercase font-bold mt-1">
                      {item.status === "a_tiempo"
                        ? "A tiempo"
                        : item.status === "tarde"
                        ? `+${item.minutesDiff}m tarde`
                        : "Inasistencia"}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setSelectedEmployee(null)}
                className="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-medium hover:bg-slate-900 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}