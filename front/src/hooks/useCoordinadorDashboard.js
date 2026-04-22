import { useState, useEffect } from 'react';
import api from '../api/axios';

export function calcularStats(usuariosData, sesionesData, bitacorasData) {
  const now = new Date();
  const sesionesMes = sesionesData.filter((s) => {
    const d = new Date(s.fecha);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  return {
    tutoresActivos: usuariosData.filter((u) => u.rol === 'tutor').length,
    beneficiariosInscritos: usuariosData.filter((u) => u.rol === 'beneficiario').length,
    sesionesMes: sesionesMes.length,
    bitacorasPendientes: bitacorasData.filter((b) => b.estado === 'pendiente').length,
  };
}

const statsVacias = {
  tutoresActivos: 0,
  beneficiariosInscritos: 0,
  sesionesMes: 0,
  bitacorasPendientes: 0,
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
