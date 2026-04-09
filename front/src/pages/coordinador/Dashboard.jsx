import { useState, useEffect } from 'react';
import { UsersIcon, AcademicCapIcon, CalendarDaysIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import Card from '../../components/ui/Card';
import Spinner from '../../components/ui/Spinner';
import PageHeader from '../../components/shared/PageHeader';
import api from '../../api/axios';

const statCards = [
  {
    key: 'tutoresActivos',
    label: 'Tutores Activos',
    icon: UsersIcon,
    color: '#f97316',
    borderColor: '#f97316',
  },
  {
    key: 'beneficiariosInscritos',
    label: 'Beneficiarios Inscritos',
    icon: AcademicCapIcon,
    color: '#22c55e',
    borderColor: '#22c55e',
  },
  {
    key: 'sesionesMes',
    label: 'Sesiones del Mes',
    icon: CalendarDaysIcon,
    color: '#3b82f6',
    borderColor: '#3b82f6',
  },
  {
    key: 'bitacorasPendientes',
    label: 'Bitácoras Pendientes',
    icon: DocumentTextIcon,
    color: '#f59e0b',
    borderColor: '#f59e0b',
  },
];

export default function CoordinadorDashboard() {
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

        const now = new Date();
        const thisMonth = sesionesData.filter?.((s) => {
          const d = new Date(s.fecha);
          return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        }) ?? [];

        setStats({
          tutoresActivos: usuariosData.filter?.((u) => u.rol === 'tutor').length ?? 0,
          beneficiariosInscritos: usuariosData.filter?.((u) => u.rol === 'beneficiario').length ?? 0,
          sesionesMes: thisMonth.length,
          bitacorasPendientes: bitacorasData.filter?.((b) => b.estado === 'pendiente').length ?? 0,
        });
      } catch {
        setStats({ tutoresActivos: 0, beneficiariosInscritos: 0, sesionesMes: 0, bitacorasPendientes: 0 });
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="Resumen general del sistema"
      />

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Spinner size="lg" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {statCards.map((card) => {
            const Icon = card.icon;
            return (
              <Card key={card.key} borderColor={card.borderColor}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm">{card.label}</p>
                    <p className="font-sora text-3xl font-bold text-gray-900 mt-1">
                      {stats?.[card.key] ?? 0}
                    </p>
                  </div>
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${card.color}20` }}
                  >
                    <Icon className="w-6 h-6" style={{ color: card.color }} />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
