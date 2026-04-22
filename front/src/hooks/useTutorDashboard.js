import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { getSesiones } from '../api/sesiones';
import { getHoras } from '../api/horas';

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

export function useTutorDashboard() {
  const [sesiones, setSesiones] = useState([]);
  const [horas, setHoras] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [s, h] = await Promise.allSettled([
          getSesiones(),
          getHoras(),
        ]);
        if (s.status === 'fulfilled') setSesiones(s.value.data || []);
        if (h.status === 'fulfilled') setHoras(h.value.data);
      } catch {
        toast.error('Error al cargar datos');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return {
    loading,
    horas,
    proxima: getProximaSesion(sesiones),
    ultimasTres: getUltimasSesiones(sesiones),
  };
}
