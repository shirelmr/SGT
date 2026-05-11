import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { getSesiones } from '../api/sesiones';
import { getHoras } from '../api/horas';
import { getAsistencia, confirmarAsistencia } from '../api/asistencias';

export function getProximaSesion(sesiones) {
  const now = new Date();
  return sesiones
    .filter((s) => s.estado === 'programada' && new Date(s.fecha) >= now)
    .sort((a, b) => new Date(a.fecha) - new Date(b.fecha))[0] ?? null;
}

export function getUltimasSesiones(sesiones, cantidad = 3) {
  return sesiones
    .filter((s) => s.estado !== 'programada')
    .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
    .slice(0, cantidad);
}

export function getBitacorasPendientes(sesiones) {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  return sesiones
    .filter((s) => new Date(s.fecha) < hoy && !s.bitacora)
    .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
}

export function useTutorDashboard() {
  const [sesiones, setSesiones] = useState([]);
  const [horas, setHoras] = useState(null);
  const [loading, setLoading] = useState(true);
  const [asistencia, setAsistencia] = useState(null);
  const [confirmando, setConfirmando] = useState(false);

  const proxima = getProximaSesion(sesiones);

  useEffect(() => {
    async function load() {
      try {
        const [s, h] = await Promise.allSettled([
          getSesiones(),
          getHoras(),
        ]);
        if (s.status === 'fulfilled') setSesiones(s.value.data || []);
        if (h.status === 'fulfilled') {
          const arr = h.value.data || [];
          setHoras(arr[0] ?? null);
        }
      } catch {
        toast.error('Error al cargar datos');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  useEffect(() => {
    if (!proxima) return;
    getAsistencia(proxima.id)
      .then((res) => setAsistencia(res.data))
      .catch(() => {});
  }, [proxima?.id]);

  const confirmar = useCallback(async () => {
    if (!proxima) return;
    setConfirmando(true);
    try {
      const res = await confirmarAsistencia(proxima.id);
      setAsistencia(res.data);
      toast.success('Asistencia confirmada');
    } catch {
      toast.error('Error al confirmar asistencia');
    } finally {
      setConfirmando(false);
    }
  }, [proxima?.id]);

  return {
    loading,
    horas,
    proxima,
    sesiones,
    ultimasTres: getUltimasSesiones(sesiones),
    bitacorasPendientes: getBitacorasPendientes(sesiones),
    asistencia,
    confirmando,
    confirmar,
  };
}
