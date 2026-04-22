import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { getSesiones } from '../api/sesiones';
import { getProgreso } from '../api/beneficiarioPeriodo';
import { calcularAvance } from './useMiProgreso';
import { getProximaSesion, getUltimasSesiones } from './useTutorDashboard';

export function useBeneficiarioDashboard() {
  const [sesiones, setSesiones] = useState([]);
  const [progreso, setProgreso] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [s, p] = await Promise.allSettled([getSesiones(), getProgreso()]);
        if (s.status === 'fulfilled') setSesiones(s.value.data || []);
        if (p.status === 'fulfilled') setProgreso(p.value.data);
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
    progreso,
    avance: calcularAvance(progreso),
    proxima: getProximaSesion(sesiones),
    ultimas: getUltimasSesiones(sesiones),
  };
}
