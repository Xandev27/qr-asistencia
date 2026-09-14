import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import type { UserSession, Coordinates } from '../types/attendance';

interface DirectAttendanceProps {
  user: UserSession | null;
}

export default function DirectAttendanceHandler({ user }: DirectAttendanceProps) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const qrToken = searchParams.get('token');

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState<string>('Obteniendo ubicación y validando asistencia...');

  useEffect(() => {
    // 1. Si no hay token en la URL, redirigir al inicio/login
    if (!qrToken) {
      navigate('/login', { replace: true });
      return;
    }

    // 2. Si no está logueado, guardamos la intención de marcaje y mandamos a /login
    if (!user) {
      localStorage.setItem('pending_qr_token', qrToken);
      navigate('/login?redirect=marcar', { replace: true });
      return;
    }

    // 3. Si está logueado, capturamos coordenadas GPS y registramos
    const processAttendance = async () => {
      if (!navigator.geolocation) {
        setStatus('error');
        setMessage('Tu navegador no soporta geolocalización.');
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const coords: Coordinates = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          };

          try {
            // Reemplazar por tu llamada fetch / Supabase real:
            // const res = await markAttendanceApi({ qrToken, coords, userId: user.id });

            // Simulación de respuesta de API:
            await new Promise((resolve) => setTimeout(resolve, 1500));

            setStatus('success');
            setMessage(`¡Entrada registrada exitosamente a las ${new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}!`);
          } catch (err) {
            setStatus('error');
            setMessage('Error al conectar con el servidor o estás fuera del rango permitido.');
          }
        },
        (error) => {
          setStatus('error');
          if (error.code === error.PERMISSION_DENIED) {
            setMessage('Debes permitir el acceso a la ubicación para registrar tu asistencia.');
          } else {
            setMessage('No se pudo obtener tu ubicación actual.');
          }
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    };

    processAttendance();
  }, [user, qrToken, navigate]);

  return (
    <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4">
      <div className="bg-slate-800 border border-slate-700 p-8 rounded-2xl max-w-sm w-full text-center shadow-xl space-y-4">
        {status === 'loading' && (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-12 w-12 text-indigo-500 animate-spin" />
            <h2 className="text-lg font-semibold">Procesando Marcaje</h2>
            <p className="text-xs text-slate-400">{message}</p>
          </div>
        )}

        {status === 'success' && (
          <div className="flex flex-col items-center gap-3">
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-emerald-400">
              <CheckCircle2 className="h-12 w-12" />
            </div>
            <h2 className="text-lg font-bold text-emerald-400">¡Asistencia Registrada!</h2>
            <p className="text-sm text-slate-300">{message}</p>
            <button
              onClick={() => navigate('/')}
              className="mt-4 w-full bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold py-2.5 rounded-xl transition-colors"
            >
              Volver al inicio
            </button>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center gap-3">
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-full text-rose-400">
              <XCircle className="h-12 w-12" />
            </div>
            <h2 className="text-lg font-bold text-rose-400">Error al Marcar</h2>
            <p className="text-xs text-slate-300">{message}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 w-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold py-2.5 rounded-xl transition-colors"
            >
              Reintentar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}