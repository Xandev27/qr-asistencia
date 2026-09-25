import React, { useState, useEffect, useMemo } from "react";
import {
  Building2,
  Plus,
  MapPin,
  Navigation,
  Edit2,
  Trash2,
  Search,
  Loader2,
  X,
  ExternalLink,
  AlertTriangle,
} from "lucide-react";
import { supabase } from "../utils/supabaseClient";

export interface DependenciaItem {
  id: string;
  name: string;
  address?: string;
  latitude: number;
  longitude: number;
  radius_meters: number;
  qr_token: string;
}

export const AdminDependencias: React.FC = () => {
  const [dependencias, setDependencias] = useState<DependenciaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Modales
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentDep, setCurrentDep] = useState<DependenciaItem | null>(null);

  // Formulario
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [radio, setRadio] = useState("50");

  // Cargar dependencias reales
  const fetchDependencias = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("dependencias")
        .select("*")
        .order("name", { ascending: true });

      if (error) throw error;

      if (data) {
        setDependencias(
          data.map((item) => ({
            id: item.id,
            name: item.name || "Sin Nombre",
            address: item.address || "",
            latitude: item.latitude || 0,
            longitude: item.longitude || 0,
            radius_meters: item.radius_meters || 50,
            qr_token: item.qr_token || "",
          }))
        );
      }
    } catch (err: any) {
      console.error("Error al obtener dependencias:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDependencias();
  }, []);

  // Filtrado
  const filteredDependencias = useMemo(() => {
    return dependencias.filter(
      (dep) =>
        dep.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (dep.address && dep.address.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [dependencias, searchTerm]);

  // Captura GPS
  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) return alert("GPS no soportado en este navegador.");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude.toString());
        setLng(pos.coords.longitude.toString());
      },
      (err) => alert("Error capturando GPS: " + err.message),
      { enableHighAccuracy: true }
    );
  };

  const handleOpenCreateModal = () => {
    setCurrentDep(null);
    setName("");
    setAddress("");
    setLat("");
    setLng("");
    setRadio("50");
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (dep: DependenciaItem) => {
    setCurrentDep(dep);
    setName(dep.name);
    setAddress(dep.address || "");
    setLat(dep.latitude.toString());
    setLng(dep.longitude.toString());
    setRadio(dep.radius_meters.toString());
    setIsModalOpen(true);
  };

  // Guardar / Actualizar en Supabase
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !lat || !lng) {
      return alert("Por favor completa el nombre, latitud y longitud.");
    }

    setSubmitting(true);
    try {
      if (currentDep) {
        // Actualizar
        const { error } = await supabase
          .from("dependencias")
          .update({
            name,
            address,
            latitude: parseFloat(lat),
            longitude: parseFloat(lng),
            radius_meters: parseInt(radio, 10),
          })
          .eq("id", currentDep.id);

        if (error) throw error;
      } else {
        // Crear
        const qrToken = `DEP_${Math.random().toString(36).substring(2, 8).toUpperCase()}_${Date.now().toString().slice(-4)}`;
        const { error } = await supabase.from("dependencias").insert([
          {
            name,
            address,
            latitude: parseFloat(lat),
            longitude: parseFloat(lng),
            radius_meters: parseInt(radio, 10),
            qr_token: qrToken,
          },
        ]);

        if (error) throw error;
      }

      await fetchDependencias();
      setIsModalOpen(false);
    } catch (err: any) {
      alert("Error al guardar la sede: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Eliminar Sede
  const handleDeleteConfirm = async () => {
    if (!currentDep) return;
    setSubmitting(true);
    try {
      const { error } = await supabase
        .from("dependencias")
        .delete()
        .eq("id", currentDep.id);

      if (error) throw error;

      await fetchDependencias();
      setIsDeleteModalOpen(false);
      setCurrentDep(null);
    } catch (err: any) {
      alert("Error al eliminar la sede: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 w-full bg-slate-50 min-h-screen font-sans text-slate-800">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="h-7 w-7 text-indigo-600" />
            Sedes y Puntos Geofenced
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Configura los perímetros GPS y genera las credenciales QR para el marcaje.
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2.5 rounded-xl shadow-sm shadow-indigo-600/20 transition-all text-sm"
        >
          <Plus className="h-4 w-4" />
          Nueva Sede
        </button>
      </div>

      {/* BARRA DE BÚSQUEDA */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6 flex items-center justify-between">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nombre o dirección..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <span className="text-xs font-semibold text-slate-500 hidden sm:inline-block">
          Total: {filteredDependencias.length} Sedes
        </span>
      </div>

      {/* GRID DE SEDES */}
      {loading ? (
        <div className="p-12 flex flex-col items-center justify-center gap-2 text-slate-400">
          <Loader2 className="h-7 w-7 animate-spin text-indigo-600" />
          <span className="text-xs font-medium">Cargando dependencias...</span>
        </div>
      ) : filteredDependencias.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredDependencias.map((dep) => (
            <div
              key={dep.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow p-5 flex flex-col justify-between gap-4"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-slate-900 text-base leading-tight">
                      {dep.name}
                    </h3>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                      <MapPin className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                      {dep.address || "Sin dirección física"}
                    </p>
                  </div>
                  <span className="bg-indigo-50 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-indigo-100 shrink-0">
                    ±{dep.radius_meters}m
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1.5 font-mono">
                  <div className="flex justify-between text-slate-600">
                    <span className="text-slate-400">Lat:</span>
                    <span>{dep.latitude}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span className="text-slate-400">Lng:</span>
                    <span>{dep.longitude}</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <a
                  href={`https://maps.google.com/?q=${dep.latitude},${dep.longitude}`}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1 text-xs font-medium"
                  title="Ver en Google Maps"
                >
                  <ExternalLink className="h-4 w-4" />
                  <span className="hidden sm:inline">Mapa</span>
                </a>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEditModal(dep)}
                    className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors"
                    title="Editar"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => {
                      setCurrentDep(dep);
                      setIsDeleteModalOpen(true);
                    }}
                    className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Eliminar"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400">
          <Building2 className="h-10 w-10 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-medium">No hay dependencias registradas.</p>
        </div>
      )}

      {/* MODAL FORMULARIO */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 bg-slate-900 text-white flex justify-between items-center">
              <h3 className="text-base font-bold">
                {currentDep ? "Editar Sede" : "Registrar Nueva Sede"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                  Nombre de la Sede
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Sede Central / Recepción"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                  Dirección Física (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ej. Av. Francisco de Miranda"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                    Latitud
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="8.8875"
                    value={lat}
                    onChange={(e) => setLat(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                    Longitud
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="-64.2452"
                    value={lng}
                    onChange={(e) => setLng(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-mono"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleGetCurrentLocation}
                className="w-full py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-xl border border-indigo-200 transition-colors flex items-center justify-center gap-1.5"
              >
                <Navigation className="h-3.5 w-3.5" />
                <span>Usar Mi Ubicación Actual (GPS)</span>
              </button>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                  Radio de Tolerancia (Metros)
                </label>
                <input
                  type="number"
                  required
                  value={radio}
                  onChange={(e) => setRadio(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-mono"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
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
                  <span>{currentDep ? "Guardar Cambios" : "Crear Sede"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CONFIRMAR ELIMINACIÓN */}
      {isDeleteModalOpen && currentDep && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden p-6 text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">¿Eliminar Sede?</h3>
            <p className="text-sm text-slate-500 mb-6">
              ¿Deseas eliminar la sede <strong className="text-slate-800">{currentDep.name}</strong>? Los accesos QR asignados a esta dependencia dejarán de ser válidos.
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
                <span>Eliminar</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};