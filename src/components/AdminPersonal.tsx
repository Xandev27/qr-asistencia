import { useState, useMemo, ChangeEvent, FormEvent } from "react";
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
} from "lucide-react";

// --- TIPOS DE DATOS ---
export type EmployeeStatus = "Activo" | "Inactivo" | "Vacaciones" | "Licencia";

export interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  department: string;
  position: string;
  hireDate: string;
  status: EmployeeStatus;
}

// --- DATOS DE PRUEBA INICIALES ---
const INITIAL_EMPLOYEES: Employee[] = [
  {
    id: "EMP001",
    firstName: "Ana",
    lastName: "García",
    email: "ana.garcia@empresa.com",
    department: "Informatica",
    position: "Desarrolladora Frontend Senior",
    hireDate: "2023-03-15",
    status: "Activo",
  },
  {
    id: "EMP002",
    firstName: "Carlos",
    lastName: "López",
    email: "carlos.lopez@empresa.com",
    department: "Informatica",
    position: "Ejecutivo de Cuentas",
    hireDate: "2022-11-01",
    status: "Activo",
  },
  {
    id: "EMP003",
    firstName: "María",
    lastName: "Rodríguez",
    email: "maria.rodriguez@empresa.com",
    department: "Informatica",
    position: "Analista de Gestión Humana",
    hireDate: "2024-01-10",
    status: "Vacaciones",
  },
];

const DEPARTMENTS = [
  "Ingeniería",
  "Ventas",
  "Recursos Humanos",
  "Administración",
  "Soporte TI",
  "Marketing",
];

export default function EmployeeManagement() {
  // ESTADOS
  const [employees, setEmployees] = useState<Employee[]>(INITIAL_EMPLOYEES);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDept, setSelectedDept] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");

  // Modales
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Empleado seleccionado para edición / vista / eliminación
  const [currentEmployee, setCurrentEmployee] = useState<Employee | null>(null);

  // Formulario Estado
  const [formData, setFormData] = useState<Omit<Employee, "id">>({
    firstName: "",
    lastName: "",
    email: "",
    department: "Ingeniería",
    position: "",
    hireDate: new Date().toISOString().split("T")[0],
    status: "Activo",
  });

  // FILTRADO Y BÚSQUEDA
  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      const fullName = `${emp.firstName} ${emp.lastName}`.toLowerCase();
      const matchesSearch =
        fullName.includes(searchTerm.toLowerCase()) ||
        emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.id.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesDept = selectedDept === "ALL" || emp.department === selectedDept;
      const matchesStatus = selectedStatus === "ALL" || emp.status === selectedStatus;

      return matchesSearch && matchesDept && matchesStatus;
    });
  }, [employees, searchTerm, selectedDept, selectedStatus]);

  // MANEJO DE FORMULARIO (Crear / Editar)
  const handleOpenCreateModal = () => {
    setCurrentEmployee(null);
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      department: "Ingeniería",
      position: "",
      hireDate: new Date().toISOString().split("T")[0],
      status: "Activo",
    });
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (emp: Employee) => {
    setCurrentEmployee(emp);
    setFormData({
      firstName: emp.firstName,
      lastName: emp.lastName,
      email: emp.email,
      department: emp.department,
      position: emp.position,
      hireDate: emp.hireDate,
      status: emp.status,
    });
    setIsFormModalOpen(true);
  };

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "salary" ? Number(value) : value,
    }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (currentEmployee) {
      // EDITAR
      setEmployees((prev) =>
        prev.map((emp) =>
          emp.id === currentEmployee.id ? { ...formData, id: emp.id } : emp
        )
      );
    } else {
      // CREAR NUEVO
      const newId = `EMP${String(employees.length + 1).padStart(3, "0")}`;
      const newEmp: Employee = { ...formData, id: newId };
      setEmployees((prev) => [...prev, newEmp]);
    }

    setIsFormModalOpen(false);
  };

  // MANEJO DE ELIMINACIÓN
  const handleDeleteConfirm = () => {
    if (currentEmployee) {
      setEmployees((prev) => prev.filter((emp) => emp.id !== currentEmployee.id));
      setIsDeleteModalOpen(false);
      setCurrentEmployee(null);
    }
  };

  // BADGE DE ESTADO
  const getStatusBadge = (status: EmployeeStatus) => {
    const styles = {
      Activo: "bg-emerald-100 text-emerald-800 border-emerald-200",
      Inactivo: "bg-slate-100 text-slate-800 border-slate-200",
      Vacaciones: "bg-amber-100 text-amber-800 border-amber-200",
      Licencia: "bg-blue-100 text-blue-800 border-blue-200",
    };

    return (
      <span
        className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border ${styles[status]}`}
      >
        {status}
      </span>
    );
  };

  return (
    <div className="p-6 w-full bg-slate-50 min-h-screen font-sans text-slate-800">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="h-7 w-7 text-indigo-600" />
            Administración de Empleados
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Gestiona la información personal, cargos, departamentos y estado laboral del personal.
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2.5 rounded-lg shadow-sm transition-all text-sm"
        >
          <UserPlus className="h-4 w-4" />
          Nuevo Empleado
        </button>
      </div>

      {/* FILTROS Y BÚSQUEDA */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6 flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, ID o email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-400" />
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="border border-slate-200 rounded-lg text-sm p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="ALL">Todos los Departamentos</option>
              {DEPARTMENTS.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="border border-slate-200 rounded-lg text-sm p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          >
            <option value="ALL">Todos los Estados</option>
            <option value="Activo">Activo</option>
            <option value="Inactivo">Inactivo</option>
            <option value="Vacaciones">Vacaciones</option>
            <option value="Licencia">Licencia</option>
          </select>
        </div>
      </div>

      {/* TABLA DE EMPLEADOS */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-700 font-semibold uppercase text-xs border-b border-slate-200">
              <tr>
                <th className="px-6 py-3">Empleado</th>
                <th className="px-6 py-3">Cargo / Depto</th>
                <th className="px-6 py-3">Contacto</th>
                <th className="px-6 py-3 text-center">Estado</th>
                <th className="px-6 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredEmployees.length > 0 ? (
                filteredEmployees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs uppercase">
                          {emp.firstName[0]}
                          {emp.lastName[0]}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">
                            {emp.firstName} {emp.lastName}
                          </p>
                          <span className="font-mono text-xs text-slate-400">
                            {emp.id}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-slate-800 font-medium">{emp.position}</p>
                      <p className="text-xs text-slate-500">{emp.department}</p>
                    </td>
                    <td className="px-6 py-4 text-xs space-y-1">
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
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                    No se encontraron empleados que coincidan con los filtros.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL CREAR / EDITAR */}
      {isFormModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 bg-slate-900 text-white flex justify-between items-center">
              <h3 className="text-lg font-bold">
                {currentEmployee ? "Editar Empleado" : "Registrar Nuevo Empleado"}
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
                    name="firstName"
                    required
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                    Apellido
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    required
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                    Departamento
                  </label>
                  <select
                    name="department"
                    value={formData.department}
                    onChange={handleInputChange}
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                  >
                    {DEPARTMENTS.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
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
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                    Estado
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                  >
                    <option value="Activo">Activo</option>
                    <option value="Inactivo">Inactivo</option>
                    <option value="Vacaciones">Vacaciones</option>
                    <option value="Licencia">Licencia</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-4 py-2 text-sm text-slate-600 font-medium hover:bg-slate-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg"
                >
                  {currentEmployee ? "Guardar Cambios" : "Registrar Empleado"}
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
                {currentEmployee.firstName[0]}
                {currentEmployee.lastName[0]}
              </div>
              <h3 className="text-xl font-bold text-slate-900">
                {currentEmployee.firstName} {currentEmployee.lastName}
              </h3>
              <p className="text-sm text-slate-500">{currentEmployee.position}</p>
              <div className="mt-2">{getStatusBadge(currentEmployee.status)}</div>
            </div>

            <div className="p-6 space-y-3 text-sm">
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">ID Empleado:</span>
                <span className="font-mono font-medium">{currentEmployee.id}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">Departamento:</span>
                <span className="font-medium">{currentEmployee.department}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">Correo Electrónico:</span>
                <span className="font-medium">{currentEmployee.email}</span>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-medium hover:bg-slate-900"
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
                {currentEmployee.firstName} {currentEmployee.lastName}
              </strong>{" "}
              del sistema? Esta acción no se puede deshacer.
            </p>

            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 text-sm text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 text-sm bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-medium"
              >
                Sí, Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}