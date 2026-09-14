import React, { useState, useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import type { Dependencia } from '../types/attendance';

export const AdminDependencias: React.FC = () => {
  // Estado local con sedes de prueba
  const [dependencias, setDependencias] = useState<Dependencia[]>([
    {
      id: 'dep_01',
      nombre: 'Sede Principal / Recepción',
      codigoQrToken: 'DEP_TOKEN_PRINCIPAL_98231',
      ubicacion: { latitude: 8.8875, longitude: -64.2452, accuracy: 5 },
      radioToleranciaMetros: 50,
      createdAt: new Date().toISOString(),
    },
  ]);

  // Sede seleccionada actualmente para imprimir
  const [selectedDependencia, setSelectedDependencia] = useState<Dependencia | null>(null);

  // Formulario para nueva dependencia
  const [nombre, setNombre] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [radio, setRadio] = useState('50');

  // Referencia para la impresión
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `QR_Sede_${selectedDependencia?.nombre.replace(/\s+/g, '_') || 'Dependencia'}`,
  });

  // Disparar impresión cuando la sede seleccionada cambie
  const triggerPrintFor = (dep: Dependencia) => {
    setSelectedDependencia(dep);
    // Le damos un pequeño tiempo a React para renderizar la ref antes de abrir el diálogo
    setTimeout(() => {
      handlePrint();
    }, 100);
  };

  // Obtener ubicación GPS actual para autocompletar el formulario de la sede
  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) return alert('GPS no disponible');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude.toString());
        setLng(pos.coords.longitude.toString());
      },
      (err) => alert('Error al capturar GPS: ' + err.message),
      { enableHighAccuracy: true }
    );
  };

  // Crear nueva sede
  const handleCreateDependencia = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre || !lat || !lng) return alert('Completa todos los campos');

    const newDep: Dependencia = {
      id: `dep_${Date.now()}`,
      nombre,
      // Token único que se codificará en el QR (en producción se genera en el Backend)
      codigoQrToken: `DEP_TOKEN_${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
      ubicacion: {
        latitude: parseFloat(lat),
        longitude: parseFloat(lng),
        accuracy: 0,
      },
      radioToleranciaMetros: parseInt(radio, 10),
      createdAt: new Date().toISOString(),
    };

    setDependencias([...dependencias, newDep]);
    setNombre('');
    setLat('');
    setLng('');
  };

  return (
    <div className="p-6 max-w-full mx-auto bg-slate-900 text-slate-100 min-h-screen">
      <header className="mb-8 border-b border-slate-800 pb-4">
        <h1 className="text-2xl font-bold text-white">Gestión de Dependencias y QRs</h1>
        <p className="text-sm text-slate-400">
          Registra las sedes de la empresa y genera su código QR impreso para marcaje.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Formulario de Registro */}
        <form onSubmit={handleCreateDependencia} className="bg-slate-800 p-5 rounded-2xl border border-slate-700 flex flex-col gap-4">
          <h2 className="text-lg font-semibold text-white">Nueva Dependencia</h2>

          <div>
            <label className="text-xs text-slate-400 block mb-1">Nombre de la Sede</label>
            <input
              type="text"
              placeholder="Ej. Almacén Central"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Latitud</label>
              <input
                type="number"
                step="any"
                placeholder="8.8875"
                value={lat}
                onChange={(e) => setLat(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Longitud</label>
              <input
                type="number"
                step="any"
                placeholder="-64.2452"
                value={lng}
                onChange={(e) => setLng(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={handleGetCurrentLocation}
            className="text-xs bg-slate-700 hover:bg-slate-600 text-slate-200 py-1.5 rounded-lg border border-slate-600 transition"
          >
            📍 Usar mi ubicación GPS actual
          </button>

          <div>
            <label className="text-xs text-slate-400 block mb-1">Radio Tolerancia (Metros)</label>
            <input
              type="number"
              value={radio}
              onChange={(e) => setRadio(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2.5 rounded-lg text-sm transition mt-2"
          >
            Guardar Dependencia
          </button>
        </form>

        {/* Lista de Dependencias Registradas */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <h2 className="text-lg font-semibold text-white">Sedes Registradas</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {dependencias.map((dep) => (
              <div
                key={dep.id}
                className="bg-slate-800 p-5 rounded-2xl border border-slate-700 flex flex-col justify-between gap-4"
              >
                <div>
                  <h3 className="font-bold text-white text-base">{dep.nombre}</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    GPS: {dep.ubicacion.latitude}, {dep.ubicacion.longitude}
                  </p>
                  <p className="text-xs text-slate-400">
                    Radio de margen: <span className="text-indigo-400 font-medium">{dep.radioToleranciaMetros}m</span>
                  </p>
                </div>

                <button
                  onClick={() => triggerPrintFor(dep)}
                  className="w-full bg-slate-700 hover:bg-indigo-600 text-white text-xs font-semibold py-2 px-4 rounded-xl border border-slate-600 transition flex items-center justify-center gap-2"
                >
                  🖨️ Imprimir Cartel QR
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};