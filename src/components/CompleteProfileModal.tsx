// src/components/CompleteProfileModal.tsx
import React, { useState } from "react";
import { supabase } from "../utils/supabaseClient";
import { User, ShieldCheck, Loader2 } from "lucide-react";

interface CompleteProfileModalProps {
  userId: string;
  defaultName?: string;
  onProfileCompleted: (updatedData: { firstName: string; lastName: string }) => void;
}

export const CompleteProfileModal: React.FC<CompleteProfileModalProps> = ({
  userId,
  defaultName = "",
  onProfileCompleted,
}) => {
  // Tratar de separar el nombre por defecto devuelto por Google si existe
  const nameParts = defaultName.trim().split(" ");
  const initialFirstName = nameParts[0] || "";
  const initialLastName = nameParts.slice(1).join(" ") || "";

  const [firstName, setFirstName] = useState(initialFirstName);
  const [lastName, setLastName] = useState(initialLastName);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!firstName.trim() || !lastName.trim()) {
      setErrorMsg("Por favor, ingresa tu nombre y apellido completos.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      // Guardar el nombre y apellido en la tabla public.users
      const { error } = await supabase
        .from("users")
        .update({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          name: `${firstName.trim()} ${lastName.trim()}`,
        })
        .eq("id", userId);

      if (error) throw error;

      onProfileCompleted({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      });
    } catch (err: any) {
      setErrorMsg(err.message || "No se pudo actualizar el perfil.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-6 animate-in fade-in zoom-in-95">
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl text-indigo-400 mb-1">
            <User className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-bold text-white">Completar Datos de Registro</h2>
          <p className="text-xs text-slate-400">
            Para la ficha de asistencia institucional, necesitamos confirmar tu nombre y apellido oficiales.
          </p>
        </div>

        {errorMsg && (
          <div className="bg-rose-500/10 border border-rose-500/20 p-3 rounded-2xl text-xs text-rose-300">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">Nombre(s)</label>
            <input
              type="text"
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Ej. Juan Carlos"
              className="w-full bg-slate-950/60 border border-slate-800 rounded-xl py-2.5 px-3.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">Apellido(s)</label>
            <input
              type="text"
              required
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Ej. Pérez Rodríguez"
              className="w-full bg-slate-950/60 border border-slate-800 rounded-xl py-2.5 px-3.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 rounded-xl transition shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 text-sm disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Guardando...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="h-4 w-4" />
                <span>Confirmar Perfil</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};