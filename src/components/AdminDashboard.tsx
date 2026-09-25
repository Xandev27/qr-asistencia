import { useEffect, useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { CheckCircle, Clock, AlertTriangle, UserX, MapPin } from "lucide-react";
import { supabase } from "../utils/supabaseClient";

const dataAsistencia = [

  { name: "Puntuales", value: 85, color: "#10B981" },

  { name: "Tardanzas", value: 10, color: "#F59E0B" },

  { name: "Ausentes", value: 5, color: "#EF4444" },

];

const sinMarcarData = [
  {
    id: 101,
    nombre: "Pedro Martínez",
    departamento: "Soporte TI",
    horario: "08:00 AM",
  },
  {
    id: 102,
    nombre: "Elena Blanco",
    departamento: "Recursos Humanos",
    horario: "08:00 AM",
  },
  {
    id: 103,
    nombre: "Roberto Gómez",
    departamento: "Redes",
    horario: "08:30 AM",
  },
  {
    id: 104,
    nombre: "Sofía Díaz",
    departamento: "Desarrollo",
    horario: "08:00 AM",
  },
];

export const AdminDashboard = () => {
  const [filtroSede, setFiltroSede] = useState("todas");
  const [tabActiva, setTabActiva] = useState<
    "recientes" | "sinMarcar" | "alertas"
  >("recientes");

  const [marcajesRecientes, setMarcajesRecientes] = useState([]);

  const fetchAssistData = async () => {
    try {
      const { data, error } = await supabase
        .from("asistencias")
        .select(
          `
        id,
        timestamp,
        latitude,
        longitude,
        ubicacion_valida,
        distanceMeters,
        user:user_id (
          name,
          email
        ),
        dependencia:dependencia_id (
          name
        )
      `,
        )
        .order("timestamp", { ascending: false });

      if (!error && data) {
        // Transformar los registros mapeados para la vista
        const formattedData = data.map((item: any) => {
          const dateObj = new Date(item.timestamp);

          // Criterio de hora para Puntualidad (Ejemplo: Entrada límite 8:15 AM)
          const hour = dateObj.getHours();
          const minutes = dateObj.getMinutes();
          const isLate = hour > 8 || (hour === 8 && minutes > 15);

          return {
            id: item.id,
            empleado:
              item.user?.name || item.user?.email || "Usuario Desconocido",
            hora: dateObj.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
              hour12: true,
            }),
            sede: item.dependencia?.name || "Sede No Especificada",
            gpsOk: item.ubicacion_valida ?? true, // Si es null, asume dentro de rango o evalúa distanceMeters
            estado: isLate ? "Tardanza" : "Puntual",
          };
        });

        setMarcajesRecientes(formattedData);
      }
    } catch (error) {
      console.error("Error cargando asistencias:", error);
    }
  };

  useEffect(() => {
    fetchAssistData();
  }, []);

  const totalPresentes = marcajesRecientes.length;
  const totalTardanzas = marcajesRecientes.filter(
    (m: any) => m.estado === "Tardanza",
  ).length;
  const totalFueraRango = marcajesRecientes.filter((m: any) => !m.gpsOk).length;

  return (
    <div className="p-6 bg-gray-50 min-h-screen space-y-6">
      {/* HEADER Y FILTROS */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Panel de Control de Asistencia
          </h1>
          <p className="text-sm text-gray-500">
            Resumen de la jornada de hoy -{" "}
            {new Date().toLocaleDateString("es-ES")}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={filtroSede}
            onChange={(e) => setFiltroSede(e.target.value)}
            className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="todas">Todas las Sedes / Departamentos</option>
            <option value="central">Informática</option>
            <option value="norte">Sucursal Norte</option>
            <option value="sur">Sucursal Sur</option>
          </select>
        </div>
      </div>

      {/* 1. TARJETAS DE RESUMEN (KPIs) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Presentes Hoy</p>
            <h3 className="text-2xl font-bold text-gray-800 mt-1">
              {totalPresentes}{" "}
              <span className="text-xs text-gray-400 font-normal">/ 140</span>
            </h3>
          </div>
          <div className="bg-emerald-50 p-3 rounded-lg text-emerald-600">
            <CheckCircle className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Tardanzas</p>
            <h3 className="text-2xl font-bold text-amber-600 mt-1">{totalTardanzas}</h3>
          </div>
          <div className="bg-amber-50 p-3 rounded-lg text-amber-600">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">
              Sin Marcar (Ausentes)
            </p>
            <h3 className="text-2xl font-bold text-rose-600 mt-1">4</h3>
          </div>
          <div className="bg-rose-50 p-3 rounded-lg text-rose-600">
            <UserX className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">
              Fuera de Rango (GPS)
            </p>
            <h3 className="text-2xl font-bold text-orange-600 mt-1">{totalFueraRango}</h3>
          </div>
          <div className="bg-orange-50 p-3 rounded-lg text-orange-600">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* 2. GRÁFICO Y TABLA INTERACTIVA */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráfico de distribución */}
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm lg:col-span-1 flex flex-col justify-between">
          <div>
            <h2 className="text-base font-semibold text-gray-800 mb-4">
              Puntualidad General
            </h2>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dataAsistencia}
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {dataAsistencia.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="flex justify-around mt-4 text-xs text-gray-600 border-t border-gray-100 pt-3">
            {dataAsistencia.map((item) => (
              <div key={item.name} className="flex items-center gap-1.5">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: item.color }}
                ></span>
                <span>
                  {item.name} ({item.value}%)
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Panel Dinámico con Tabs */}
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm lg:col-span-2">
          {/* Header del Tab */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 border-b border-gray-100 pb-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setTabActiva("recientes")}
                className={`text-sm font-semibold pb-1 px-1 border-b-2 transition-colors ${
                  tabActiva === "recientes"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                Últimos Marcajes
              </button>
              <button
                onClick={() => setTabActiva("sinMarcar")}
                className={`text-sm font-semibold pb-1 px-1 border-b-2 transition-colors flex items-center gap-1.5 ${
                  tabActiva === "sinMarcar"
                    ? "border-rose-600 text-rose-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                Sin Marcar
                <span className="bg-rose-100 text-rose-700 text-xs px-1.5 py-0.5 rounded-full font-bold">
                  {sinMarcarData.length}
                </span>
              </button>
            </div>

            {tabActiva === "recientes" && (
              <span className="text-xs bg-emerald-50 text-emerald-600 font-medium px-2.5 py-1 rounded-md animate-pulse self-start sm:self-auto">
                ● En Vivo
              </span>
            )}
          </div>

          {/* VISTA 1: Últimos Marcajes */}
          {tabActiva === "recientes" && (
            <div className="overflow-x-auto max-h-[300px]">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50 text-xs text-gray-400 uppercase sticky top-0">
                  <tr>
                    <th className="py-2.5 px-3">Empleado</th>
                    <th className="py-2.5 px-3">Hora</th>
                    <th className="py-2.5 px-3">Sede</th>
                    <th className="py-2.5 px-3">Ubicación GPS</th>
                    <th className="py-2.5 px-3">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {marcajesRecientes.map((reg: any) => (
                    <tr
                      key={reg.id}
                      className="hover:bg-gray-50/80 transition-colors"
                    >
                      <td className="py-3 px-3 font-medium text-gray-800">
                        {reg.empleado}
                      </td>
                      <td className="py-3 px-3 font-semibold text-gray-700">
                        {reg.hora}
                      </td>
                      <td className="py-3 px-3">{reg.sede}</td>
                      <td className="py-3 px-3">
                        {reg.gpsOk ? (
                          <span className="inline-flex items-center text-xs text-emerald-600 gap-1">
                            <MapPin className="w-3.5 h-3.5" /> En Rango
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-xs text-rose-500 gap-1 font-medium">
                            <AlertTriangle className="w-3.5 h-3.5" /> Fuera de
                            Rango
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                            reg.estado === "Puntual"
                              ? "bg-emerald-100 text-emerald-700"
                              : reg.estado === "Tardanza"
                                ? "bg-amber-100 text-amber-700"
                                : "bg-rose-100 text-rose-700"
                          }`}
                        >
                          {reg.estado}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* VISTA 2: Empleados Sin Marcar */}
          {tabActiva === "sinMarcar" && (
            <div className="overflow-x-auto max-h-[300px]">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50 text-xs text-gray-400 uppercase sticky top-0">
                  <tr>
                    <th className="py-2.5 px-3">Empleado</th>
                    <th className="py-2.5 px-3">Departamento</th>
                    <th className="py-2.5 px-3">Hora Entrada Esperada</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {sinMarcarData.map((emp) => (
                    <tr
                      key={emp.id}
                      className="hover:bg-gray-50/80 transition-colors"
                    >
                      <td className="py-3 px-3 font-medium text-gray-800">
                        {emp.nombre}
                      </td>
                      <td className="py-3 px-3">{emp.departamento}</td>
                      <td className="py-3 px-3 text-rose-600 font-medium">
                        {emp.horario}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
