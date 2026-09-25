import { useState, useMemo, useEffect } from "react";
import type { ChangeEvent, FormEvent } from "react";
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Edit2,
  Trash2,
  Eye,
  Mail,
  X,
  AlertTriangle,
  Loader2,
  UserCheck,
  Palmtree,
  Briefcase,
  RotateCcw,
} from "lucide-react";
import { supabase } from "../utils/supabaseClient";

export type EmployeeStatus = "Activo" | "Inactivo" | "Vacaciones" | "Licencia";

export interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  dependencia_id: string;
  position?: string;
  status?: EmployeeStatus;
}

export interface Dependencia {
  id: string;
  name: string;
}

export default function EmployeeManagement() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Dependencia[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDept, setSelectedDept] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const [currentEmployee, setCurrentEmployee] = useState<Employee | null>(null);

  const [formData, setFormData] = useState<Omit<Employee, "id">>({
    first_name: "",
    last_name: "",
    email: "",
    dependencia_id: "",
    position: "",
    status: "Activo",
  });

  // Fetch de empleados desde Supabase
  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("id, first_name, last_name, email, dependencia_id")
        .neq("role", "superadmin")
        .order("first_name", { ascending: true });

      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      console.error("Error al cargar empleados:", error);
    }
  };

  // Fetch de dependencias / departamentos desde Supabase
  const fetchDepartments = async () => {
    try {
      const { data, error } = await supabase
        .from("dependencias")
        .select("id, name")
        .order("name", { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        setDepartments(data);
      }
    } catch (error) {
      console.error("Error al cargar dependencias:", error);
    }
  };

  useEffect(() => {
    const initData = async () => {
      setLoading(true);
      await Promise.all([fetchEmployees(), fetchDepartments()]);
      setLoading(false);
    };
    initData();
  }, []);

  // Mapeador auxiliar para obtener el nombre de la sede según su ID
  const getDepartmentName = (depId: string) => {
    const dep = departments.find((d) => d.id === depId);
    return dep ? dep.name : "Sin Asignar";
  };

  // MÉTRICAS (KPIs)
  const metrics = useMemo(() => {
    return {
      total: employees.length,
      activos: employees.filter((e) => (e.status || "Activo") === "Activo").length,
      vacaciones: employees.filter((e) => e.status === "Vacaciones").length,
      licencia: employees.filter((e) => e.status === "Licencia").length,
    };
  }, [employees]);

  // FILTRADO
  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      const fullName = `${emp.first_name || ""} ${emp.last_name || ""}`.toLowerCase();
      const matchesSearch =
        fullName.includes(searchTerm.toLowerCase()) ||
        (emp.email && emp.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (emp.id && emp.id.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesDept =
        selectedDept === "ALL" || emp.dependencia_id === selectedDept;
      const matchesStatus =
        selectedStatus === "ALL" || (emp.status || "Activo") === selectedStatus;

      return matchesSearch && matchesDept && matchesStatus;
    });
  }, [employees, searchTerm, selectedDept, selectedStatus]);

  const handleOpenCreateModal = () => {
    setCurrentEmployee(null);
    setFormData({
      first_name: "",
      last_name: "",
      email: "",
      dependencia_id: departments[0]?.id || "",
      position: "",
      status: "Activo",
    });
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (emp: Employee) => {
    setCurrentEmployee(emp);
    setFormData({
      first_name: emp.first_name || "",
      last_name: emp.last_name || "",
      email: emp.email || "",
      dependencia_id: emp.dependencia_id || departments[0]?.id || "",
      position: emp.position || "",
      status: emp.status || "Activo",
    });
    setIsFormModalOpen(true);
  };

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // PERSISTENCIA REAL A SUPABASE
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const fullName = `${formData.first_name.trim()} ${formData.last_name.trim()}`;

      if (currentEmployee) {
        // ACTUALIZAR REGISTRO EXISTENTE
        const { error } = await supabase
          .from("users")
          .update({
            first_name: formData.first_name,
            last_name: formData.last_name,
            name: fullName,
            email: formData.email,
            dependencia_id: formData.dependencia_id,
            position: formData.position,
            status: formData.status,
          })
          .eq("id", currentEmployee.id);

        if (error) throw error;
      } else {
        // CREAR REGISTRO NUEVO
        const { error } = await supabase.from("users").insert([
          {
            first_name: formData.first_name,
            last_name: formData.last_name,
            name: fullName,
            email: formData.email,
            dependencia_id: formData.dependencia_id,
            position: formData.position,
            status: formData.status,
            role: "employee",
          },
        ]);

        if (error) throw error;
      }

      await fetchEmployees();
      setIsFormModalOpen(false);
    } catch (error: any) {
      alert("Error al guardar en Supabase: " + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!currentEmployee) return;
    setSubmitting(true);

    try {
      const { error } = await supabase
        .from("users")
        .delete()
        .eq("id", currentEmployee.id);

      if (error) throw error;

      await fetchEmployees();
      setIsDeleteModalOpen(false);
      setCurrentEmployee(null);
    } catch (error: any) {
      alert("Error al eliminar registro: " + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedDept("ALL");
    setSelectedStatus("ALL");
  };

  const getStatusBadge = (status?: EmployeeStatus) => {
    const activeStatus = status || "Activo";
    const styles = {
      Activo: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
      Inactivo: "bg-slate-100 text-slate-700 border-slate-200",
      Vacaciones: "bg-amber-50 text-amber-700 border-amber-200/80",
      Licencia: "bg-indigo-50 text-indigo-700 border-indigo-200/80",
    };

    return (
      <span
        className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border ${
          styles[activeStatus] || styles.Inactivo
        }`}
      >
        {activeStatus}
      </span>
    );
  };

  return (
    <div className="p-6 w-full bg-slate-50 min-h-screen font-sans text-slate-800">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="h-7 w-7 text-indigo-600" />
            Administración de Empleados
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Gestiona la información personal, cargos y estado laboral del personal.
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2.5 rounded-xl shadow-sm shadow-indigo-600/20 transition-all text-sm"
        >
          <UserPlus className="h-4 w-4" />
          Nuevo Empleado
        </button>
      </div>

      {/* METRICAS / KPIS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase">
              Total Empleados
            </p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">
              {metrics.total}
            </h3>
          </div>
          <div className="p-3 bg-slate-100 text-slate-600 rounded-xl">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase">
              Activos
            </p>
            <h3 className="text-2xl font-bold text-emerald-600 mt-1">
              {metrics.activos}
            </h3>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase">
              En Vacaciones
            </p>
            <h3 className="text-2xl font-bold text-amber-600 mt-1">
              {metrics.vacaciones}
            </h3>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Palmtree className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase">
              En Licencia
            </p>
            <h3 className="text-2xl font-bold text-indigo-600 mt-1">
              {metrics.licencia}
            </h3>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Briefcase className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* BÚSQUEDA Y FILTROS */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6 flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, ID o email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-400" />
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="border border-slate-200 rounded-xl text-sm p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="ALL">Todas las Dependencias</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="border border-slate-200 rounded-xl text-sm p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          >
            <option value="ALL">Todos los Estados</option>
            <option value="Activo">Activo</option>
            <option value="Inactivo">Inactivo</option>
            <option value="Vacaciones">Vacaciones</option>
            <option value="Licencia">Licencia</option>
          </select>
        </div>
      </div>

      {/* TABLA DE REGISTROS */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center gap-2 text-slate-400">
            <Loader2 className="h-7 w-7 animate-spin text-indigo-600" />
            <span className="text-xs font-medium">Cargando personal...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-700 font-semibold uppercase text-xs border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3">Empleado</th>
                  <th className="px-6 py-3">Cargo / Dependencia</th>
                  <th className="px-6 py-3">Contacto</th>
                  <th className="px-6 py-3 text-center">Estado</th>
                  <th className="px-6 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredEmployees.length > 0 ? (
                  filteredEmployees.map((emp) => (
                    <tr
                      key={emp.id}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs uppercase shrink-0">
                            {emp.first_name?.[0] || "U"}
                            {emp.last_name?.[0] || ""}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900">
                              {emp.first_name} {emp.last_name}
                            </p>
                            <span className="font-mono text-[10px] text-slate-400 block truncate max-w-30">
                              {emp.id}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-slate-800 font-medium">
                          {emp.position || "Sin Cargo"}
                        </p>
                        <p className="text-xs text-slate-500">
                          {getDepartmentName(emp.dependencia_id)}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-xs">
                        <div className="flex items-center gap-1.5 text-slate-600">
                          <Mail className="h-3.5 w-3.5 text-slate-400" />
                          {emp.email}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {getStatusBadge(emp.status)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => {
                              setCurrentEmployee(emp);
                              setIsDetailModalOpen(true);
                            }}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Ver Detalle"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEditModal(emp)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Editar"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {
                              setCurrentEmployee(emp);
                              setIsDeleteModalOpen(true);
                            }}
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-12 text-center text-slate-400"
                    >
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Users className="h-8 w-8 text-slate-300" />
                        <p className="text-sm font-medium">
                          No se encontraron empleados con los filtros aplicados.
                        </p>
                        <button
                          onClick={clearFilters}
                          className="mt-2 inline-flex items-center gap-1.5 text-xs text-indigo-600 hover:underline font-semibold"
                        >
                          <RotateCcw className="h-3.5 w-3.5" /> Limpiar Filtros
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL CREAR / EDITAR */}
      {isFormModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 bg-slate-900 text-white flex justify-between items-center">
              <h3 className="text-lg font-bold">
                {currentEmployee
                  ? "Editar Empleado"
                  : "Registrar Nuevo Empleado"}
              </h3>
              <button
                onClick={() => setIsFormModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                    Nombre
                  </label>
                  <input
                    type="text"
                    name="first_name"
                    required
                    value={formData.first_name}
                    onChange={handleInputChange}
                    className="w-full border border-slate-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                    Apellido
                  </label>
                  <input
                    type="text"
                    name="last_name"
                    required
                    value={formData.last_name}
                    onChange={handleInputChange}
                    className="w-full border border-slate-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                    Dependencia / Sede
                  </label>
                  <select
                    name="dependencia_id"
                    value={formData.dependencia_id}
                    onChange={handleInputChange}
                    className="w-full border border-slate-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                  >
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                    Cargo
                  </label>
                  <input
                    type="text"
                    name="position"
                    required
                    value={formData.position}
                    onChange={handleInputChange}
                    className="w-full border border-slate-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                  Estado Laboral
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                >
                  <option value="Activo">Activo</option>
                  <option value="Inactivo">Inactivo</option>
                  <option value="Vacaciones">Vacaciones</option>
                  <option value="Licencia">Licencia</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-4 py-2 text-sm text-slate-600 font-medium hover:bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl flex items-center gap-2 disabled:opacity-50"
                >
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  <span>
                    {currentEmployee ? "Guardar Cambios" : "Registrar Empleado"}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DETALLE DE EMPLEADO */}
      {isDetailModalOpen && currentEmployee && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 text-center border-b border-slate-100">
              <div className="w-16 h-16 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xl flex items-center justify-center mx-auto mb-3">
                {currentEmployee.first_name?.[0]}
                {currentEmployee.last_name?.[0]}
              </div>
              <h3 className="text-xl font-bold text-slate-900">
                {currentEmployee.first_name} {currentEmployee.last_name}
              </h3>
              <p className="text-sm text-slate-500">
                {currentEmployee.position || "Sin Cargo"}
              </p>
              <div className="mt-2">
                {getStatusBadge(currentEmployee.status)}
              </div>
            </div>

            <div className="p-6 space-y-3 text-sm">
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">ID Empleado:</span>
                <span className="font-mono font-medium text-xs text-slate-700">
                  {currentEmployee.id}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">Dependencia:</span>
                <span className="font-medium">
                  {getDepartmentName(currentEmployee.dependencia_id)}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">Correo Electrónico:</span>
                <span className="font-medium">{currentEmployee.email}</span>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="px-4 py-2 bg-slate-800 text-white rounded-xl text-sm font-medium hover:bg-slate-900"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CONFIRMAR ELIMINACIÓN */}
      {isDeleteModalOpen && currentEmployee && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden p-6 text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              ¿Eliminar Empleado?
            </h3>
            <p className="text-sm text-slate-500 mb-6">
              ¿Estás seguro de que deseas remover a{" "}
              <strong className="text-slate-800">
                {currentEmployee.first_name} {currentEmployee.last_name}
              </strong>{" "}
              del sistema? Esta acción no se puede deshacer.
            </p>

            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 text-sm text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={submitting}
                className="px-4 py-2 text-sm bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-medium flex items-center gap-2 disabled:opacity-50"
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                <span>Sí, Eliminar</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}