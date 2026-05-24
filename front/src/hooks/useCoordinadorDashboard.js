import { useState, useEffect } from 'react';
import api from '../api/axios';

const MONTHS_ES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

export function calcularStats(usuariosData, sesionesData, bitacorasData) {
  const now = new Date();

  const sesionesMes = sesionesData.filter((s) => {
    const d = new Date(s.fecha);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  // Last 6 months session counts for bar chart
  const sesionesporMes = [];
  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const count = sesionesData.filter((s) => {
      const d = new Date(s.fecha);
      return d.getMonth() === date.getMonth() && d.getFullYear() === date.getFullYear();
    }).length;
    sesionesporMes.push({ mes: MONTHS_ES[date.getMonth()], sesiones: count });
  }

  // Bitacoras grouped by estado for donut chart
  const pendientes = bitacorasData.filter((b) => b.estado === 'pendiente').length;
  const aprobadas = bitacorasData.filter((b) => b.estado === 'aprobado').length;
  const rechazadas = bitacorasData.filter((b) => b.estado === 'rechazado').length;
  const bitacorasPorEstado = [
    { name: 'Pendientes', value: pendientes, color: '#f59e0b' },
    { name: 'Aprobadas', value: aprobadas, color: '#22c55e' },
    { name: 'Rechazadas', value: rechazadas, color: '#ef4444' },
  ];

  // Last 5 sessions sorted by date
  const actividadReciente = [...sesionesData]
    .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
    .slice(0, 5);

  return {
    tutoresActivos: usuariosData.filter((u) => u.rol === 'tutor').length,
    beneficiariosInscritos: usuariosData.filter((u) => u.rol === 'beneficiario').length,
    sesionesMes: sesionesMes.length,
    bitacorasPendientes: pendientes,
    sesionesporMes,
    bitacorasPorEstado,
    actividadReciente,
    totalSesiones: sesionesData.length,
    totalBitacoras: bitacorasData.length,
  };
}

const statsVacias = {
  tutoresActivos: 0,
  beneficiariosInscritos: 0,
  sesionesMes: 0,
  bitacorasPendientes: 0,
  sesionesporMes: [],
  bitacorasPorEstado: [],
  actividadReciente: [],
  totalSesiones: 0,
  totalBitacoras: 0,
};

export function useCoordinadorDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const [usuarios, sesiones, bitacoras] = await Promise.allSettled([
          api.get('/usuarios'),
          api.get('/sesiones'),
          api.get('/bitacoras'),
        ]);

        const usuariosData = usuarios.status === 'fulfilled' ? usuarios.value.data : [];
        const sesionesData = sesiones.status === 'fulfilled' ? sesiones.value.data : [];
        const bitacorasData = bitacoras.status === 'fulfilled' ? bitacoras.value.data : [];

        setStats(calcularStats(usuariosData, sesionesData, bitacorasData));
      } catch {
        setStats(statsVacias);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  return { loading, stats };
}
