import { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { CheckCircle, Clock, AlertTriangle, UserX, MapPin } from 'lucide-react';

// Datos de ejemplo para el gráfico circular
const dataAsistencia = [
  { name: 'Puntuales', value: 85, color: '#10B981' }, // Verde
  { name: 'Tardanzas', value: 10, color: '#F59E0B' }, // Amarillo
  { name: 'Ausentes', value: 5, color: '#EF4444' },   // Rojo
];

// Datos de ejemplo para el Feed en tiempo real
const marcajesRecientes = [
  { id: 1, nombre: 'Ana García', hora: '08:02 AM', sede: 'Sede Central', estado: 'Puntual', gpsOk: true },
  { id: 2, nombre: 'Carlos López', hora: '08:14 AM', sede: 'Sucursal Norte', estado: 'Tardanza', gpsOk: true },
  { id: 3, nombre: 'María Rodríguez', hora: '08:25 AM', sede: 'Sede Central', estado: 'Alerta GPS', gpsOk: false },
  { id: 4, nombre: 'Juan Pérez', hora: '08:30 AM', sede: 'Sucursal Sur', estado: 'Puntual', gpsOk: true },
];

export const AdminDashboard = () => {
  const [filtroSede, setFiltroSede] = useState('todas');

  return (
    <div className="p-6 bg-gray-50 min-h-screen space-y-6">
      
      {/* HEADER Y FILTROS */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Panel de Control de Asistencia</h1>
          <p className="text-sm text-gray-500">Resumen de la jornada de hoy - {new Date().toLocaleDateString('es-ES')}</p>
        </div>
        
        <div className="flex items-center gap-3">
          <select 
            value={filtroSede} 
            onChange={(e) => setFiltroSede(e.target.value)}
            className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="todas">Todas las Sedes / Dependencias</option>
            <option value="central">Informatica</option>
            <option value="norte">Sucursal Norte</option>
            <option value="sur">Sucursal Sur</option>
          </select>
        </div>
      </div>

      {/* 1. TARJETAS DE RESUMEN (KPIs) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Presentes */}
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Presentes Hoy</p>
            <h3 className="text-2xl font-bold text-gray-800 mt-1">124 <span className="text-xs text-gray-400 font-normal">/ 140</span></h3>
          </div>
          <div className="bg-emerald-50 p-3 rounded-lg text-emerald-600">
            <CheckCircle className="w-6 h-6" />
          </div>
        </div>

        {/* Tardanzas */}
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Tardanzas</p>
            <h3 className="text-2xl font-bold text-amber-600 mt-1">12</h3>
          </div>
          <div className="bg-amber-50 p-3 rounded-lg text-amber-600">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        {/* Ausentes */}
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Sin Marcar (Ausentes)</p>
            <h3 className="text-2xl font-bold text-rose-600 mt-1">4</h3>
          </div>
          <div className="bg-rose-50 p-3 rounded-lg text-rose-600">
            <UserX className="w-6 h-6" />
          </div>
        </div>

        {/* Alertas GPS */}
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Fuera de Rango (GPS)</p>
            <h3 className="text-2xl font-bold text-orange-600 mt-1">2</h3>
          </div>
          <div className="bg-orange-50 p-3 rounded-lg text-orange-600">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* 2. GRÁFICO Y FEED EN TIEMPO REAL */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Gráfico de distribución de puntualidad */}
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm lg:col-span-1">
          <h2 className="text-base font-semibold text-gray-800 mb-4">Puntualidad General</h2>
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
          <div className="flex justify-around mt-2 text-xs text-gray-600">
            {dataAsistencia.map((item) => (
              <div key={item.name} className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></span>
                <span>{item.name} ({item.value}%)</span>
              </div>
            ))}
          </div>
        </div>

        {/* Feed de entradas y salidas recientes */}
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-800">Últimos Marcajes Registrados</h2>
            <span className="text-xs bg-blue-50 text-blue-600 font-medium px-2 py-1 rounded-md animate-pulse">
              En Vivo
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-xs text-gray-400 uppercase">
                <tr>
                  <th className="py-2.5 px-3">Empleado</th>
                  <th className="py-2.5 px-3">Hora</th>
                  <th className="py-2.5 px-3">Sede</th>
                  <th className="py-2.5 px-3">Ubicación GPS</th>
                  <th className="py-2.5 px-3">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {marcajesRecientes.map((reg) => (
                  <tr key={reg.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="py-3 px-3 font-medium text-gray-800">{reg.nombre}</td>
                    <td className="py-3 px-3">{reg.hora}</td>
                    <td className="py-3 px-3">{reg.sede}</td>
                    <td className="py-3 px-3">
                      {reg.gpsOk ? (
                        <span className="inline-flex items-center text-xs text-emerald-600 gap-1">
                          <MapPin className="w-3.5 h-3.5" /> En Rango
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-xs text-rose-500 gap-1 font-medium">
                          <AlertTriangle className="w-3.5 h-3.5" /> Fuera de Rango
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        reg.estado === 'Puntual' ? 'bg-emerald-100 text-emerald-700' :
                        reg.estado === 'Tardanza' ? 'bg-amber-100 text-amber-700' :
                        'bg-rose-100 text-rose-700'
                      }`}>
                        {reg.estado}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </div>
  );
};