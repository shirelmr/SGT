import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { getSesiones } from '../api/sesiones';
import { getHoras } from '../api/horas';
import { getAsistencia, confirmarAsistencia } from '../api/asistencias';

const MONTHS_ES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

const getLocalDate = (fechaStr) => {
  if (!fechaStr) return new Date(0);
  const [year, month, day] = fechaStr.split('T')[0].split('-').map(Number);
  return new Date(year, month - 1, day);
};

export function getProximaSesion(sesiones) {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0); 
  
  return sesiones
    .filter((s) => s.estado === 'programada' && getLocalDate(s.fecha) >= hoy)
    .sort((a, b) => getLocalDate(a.fecha) - getLocalDate(b.fecha))[0] ?? null;
}

export function getUltimasSesiones(sesiones, cantidad = 3) {
  return sesiones
    .filter((s) => s.estado !== 'programada')
    .sort((a, b) => getLocalDate(b.fecha) - getLocalDate(a.fecha))
    .slice(0, cantidad);
}

export function getSesionesporMes(sesiones) {
  const now = new Date();
  const result = [];
  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const count = sesiones.filter((s) => {
      const [y, m] = s.fecha.split('T')[0].split('-').map(Number);
      return (m - 1) === date.getMonth() && y === date.getFullYear();
    }).length;
    result.push({ mes: MONTHS_ES[date.getMonth()], sesiones: count });
  }
  return result;
}

export function getBitacorasPorEstado(sesiones) {
  const bitacoras = sesiones.filter((s) => s.bitacora).map((s) => s.bitacora);
  const data = [
    { name: 'Pendiente',   value: bitacoras.filter((b) => b.estado === 'pendiente').length,          color: '#f59e0b' },
    { name: 'Aprobada',    value: bitacoras.filter((b) => b.estado === 'aprobado').length,            color: '#22c55e' },
    { name: 'No aprobada', value: bitacoras.filter((b) => b.estado === 'no_aprobada').length,         color: '#ef4444' },
    { name: 'Sin horas',   value: bitacoras.filter((b) => b.estado === 'aprobado_sin_horas').length,  color: '#f97316' },
  ];
  return data.filter((d) => d.value > 0);
}

export function getBitacorasPendientes(sesiones) {
  const ahora = new Date(); // Fecha y hora exacta de este momento

  return sesiones
    .filter((s) => {
      // 1. Si ya tiene bitácora, no la mostramos
      if (s.bitacora) return false;

      // 2. Combinamos fecha y hora para saber si la sesión ya ocurrió
      // s.fecha viene como '2026-05-25T...' y s.hora_inicio como '17:00'
      const [y, m, d] = s.fecha.split('T')[0].split('-').map(Number);
      const [hr, min] = (s.hora_inicio || '00:00').split(':').map(Number);
      
      const fechaSesion = new Date(y, m - 1, d, hr, min);

      // 3. Solo mostramos si la sesión ya pasó
      return fechaSesion < ahora;
    })
    .sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
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

  const sesionesPeriodoActivo = sesiones.filter((s) => s.periodo?.activo === true);

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
    sesionesporMes: getSesionesporMes(sesiones),
    bitacorasPorEstado: getBitacorasPorEstado(sesionesPeriodoActivo),
    sesionesRealizadas: sesionesPeriodoActivo.filter((s) => s.estado === 'realizada').length,
    totalBitacoras: sesionesPeriodoActivo.filter((s) => s.bitacora).length,
  };
}