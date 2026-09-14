import { useState, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
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
} from "lucide-react";

import { AdminDashboard } from "./AdminDashboard";

// --- DATOS FICTICIOS (MOCK DATA) ---
const WEEKLY_DATA = [
  {
    id: "EMP001",
    name: "Ana García",
    department: "Ingeniería",
    attendance: 100,
    presentDays: 5,
    totalDays: 5,
  },
  {
    id: "EMP002",
    name: "Carlos López",
    department: "Ventas",
    attendance: 80,
    presentDays: 4,
    totalDays: 5,
  }
];

const MONTHLY_DATA = [
  {
    id: "EMP001",
    name: "Ana García",
    department: "Ingeniería",
    attendance: 95,
    presentDays: 19,
    totalDays: 20,
  },
  {
    id: "EMP002",
    name: "Carlos López",
    department: "Ventas",
    attendance: 85,
    presentDays: 17,
    totalDays: 20,
  }
];

export default function AdminAttendanceDashboard() {
  const [timeframe, setTimeframe] = useState("weekly");
  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("ALL");

  // Seleccionar los datos correspondientes
  const currentData = timeframe === "weekly" ? WEEKLY_DATA : MONTHLY_DATA;

  // Filtrar datos según búsqueda y departamento
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

  // Cálculo de Métricas (KPIs)
  const totalEmployees = filteredData.length;
  const avgAttendance = useMemo(() => {
    if (totalEmployees === 0) return 0;
    const sum = filteredData.reduce((acc, curr) => acc + curr.attendance, 0);
    return (sum / totalEmployees).toFixed(1);
  }, [filteredData, totalEmployees]);

  const lowAttendanceCount = useMemo(() => {
    return filteredData.filter((emp) => emp.attendance < 80).length;
  }, [filteredData]);

  // Obtener lista única de departamentos
  const departments = useMemo(() => {
    const depts = new Set(currentData.map((d) => d.department));
    return ["ALL", ...Array.from(depts)];
  }, [currentData]);

  // Color de barra dinámico según desempeño
  const getBarColor = (percentage) => {
    if (percentage >= 90) return "#10B981"; // Verde (Excelente)
    if (percentage >= 75) return "#F59E0B"; // Amarillo/Naranja (Aceptable)
    return "#EF4444"; // Rojo (Crítico)
  };

  return (
    <div className="p-6 w-full bg-slate-50 min-h-screen font-sans text-slate-800">
      {/* HEADER DE LA VISTA */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="h-7 w-7 text-indigo-600" />
            Control de Asistencia - Vista Superusuario
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Métricas de rendimiento e inasistencias por empleado.
          </p>
        </div>

        {/* SELECTOR DE PERÍODO (SEMANAL / MENSUAL) */}
        <div className="flex items-center bg-white border border-slate-200 rounded-lg p-1 shadow-sm self-start md:self-auto">
          <button
            onClick={() => setTimeframe("weekly")}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all ${
              timeframe === "weekly"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Calendar className="h-4 w-4" />
            Semanal
          </button>
          <button
            onClick={() => setTimeframe("monthly")}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all ${
              timeframe === "monthly"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Calendar className="h-4 w-4" />
            Mensual
          </button>
        </div>
      </div>

      {/* TARJETAS DE KPIS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total Empleados
            </p>
            <p className="text-2xl font-bold text-slate-900">
              {totalEmployees}
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
            <CheckCircle className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Asistencia Promedio (
              {timeframe === "weekly" ? "Semanal" : "Mensual"})
            </p>
            <p className="text-2xl font-bold text-slate-900">
              {avgAttendance}%
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Asistencia Crítica (&lt;80%)
            </p>
            <p className="text-2xl font-bold text-slate-900">
              {lowAttendanceCount} Empleados
            </p>
          </div>
        </div>
      </div>

      {/* FILTROS Y BÚSQUEDA */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6 flex flex-col md:flex-row gap-4 justify-between">
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

      {/* GRÁFICO RECHARTS */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mb-8">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">
          Porcentaje de Asistencia por Empleado
        </h2>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={filteredData}
              margin={{ top: 20, right: 30, left: 0, bottom: 25 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#E2E8F0"
              />
              <XAxis
                dataKey="name"
                tick={{ fill: "#64748B", fontSize: 12 }}
                interval={0}
                angle={-15}
                textAnchor="end"
              />
              <YAxis
                domain={[0, 100]}
                unit="%"
                tick={{ fill: "#64748B", fontSize: 12 }}
              />
              <Tooltip
                formatter={(value) => [`${value}%`, "Asistencia"]}
                labelStyle={{ fontWeight: "bold", color: "#0F172A" }}
                contentStyle={{
                  borderRadius: "8px",
                  border: "1px solid #E2E8F0",
                }}
              />
              <Legend
                verticalAlign="top"
                align="right"
                wrapperStyle={{ paddingBottom: "10px" }}
              />

              {/* Línea de referencia indicando el objetivo de asistencia (90%) */}
              <ReferenceLine
                y={90}
                label={{
                  value: "Meta (90%)",
                  fill: "#10B981",
                  position: "top",
                  fontSize: 12,
                }}
                stroke="#10B981"
                strokeDasharray="4 4"
              />

              <Bar
                dataKey="attendance"
                name="Porcentaje %"
                radius={[4, 4, 0, 0]}
              >
                {filteredData.map((entry) => (
                  <Cell
                    key={`cell-${entry.id}`}
                    fill={getBarColor(entry.attendance)}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* TABLA DE DETALLES */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">
            Detalle Individual
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-700 font-semibold uppercase text-xs">
              <tr>
                <th className="px-6 py-3">ID</th>
                <th className="px-6 py-3">Empleado</th>
                <th className="px-6 py-3">Departamento</th>
                <th className="px-6 py-3 text-center">Días Asistidos</th>
                <th className="px-6 py-3 text-center">% Asistencia</th>
                <th className="px-6 py-3 text-center">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredData.map((emp) => (
                <tr
                  key={emp.id}
                  className="hover:bg-slate-50 transition-colors"
                >
                  <td className="px-6 py-4 font-mono text-xs">{emp.id}</td>
                  <td className="px-6 py-4 font-medium text-slate-900">
                    {emp.name}
                  </td>
                  <td className="px-6 py-4">{emp.department}</td>
                  <td className="px-6 py-4 text-center">
                    {emp.presentDays} / {emp.totalDays}
                  </td>
                  <td className="px-6 py-4 text-center font-semibold">
                    {emp.attendance}%
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        emp.attendance >= 90
                          ? "bg-emerald-100 text-emerald-800"
                          : emp.attendance >= 75
                            ? "bg-amber-100 text-amber-800"
                            : "bg-rose-100 text-rose-800"
                      }`}
                    >
                      {emp.attendance >= 90
                        ? "Excelente"
                        : emp.attendance >= 75
                          ? "Aceptable"
                          : "Crítico"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
