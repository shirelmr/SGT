import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { DocumentTextIcon, CheckCircleIcon, ClockIcon } from '@heroicons/react/24/outline';
import { getBitacoras } from '../../api/bitacoras';
import PageHeader from '../../components/shared/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';

export default function RevisorDashboard() {
  const [stats, setStats] = useState({ total: 0, revisadas: 0, pendientes: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getBitacoras()
      .then((r) => {
        const all = r.data || [];
        const revisadas = all.filter((b) => b.estado === 'aprobado' || b.estado === 'no_aprobada').length;
        const pendientes = all.filter((b) => !b.estado || b.estado === 'pendiente').length;
        setStats({ total: all.length, revisadas, pendientes });
      })
      .catch(() => toast.error('Error al cargar bitácoras'))
      .finally(() => setLoading(false));
  }, []);

  const cards = [
    { label: 'Total Asignadas', value: stats.total, icon: DocumentTextIcon, color: '#f97316', borderColor: '#f97316' },
    { label: 'Revisadas', value: stats.revisadas, icon: CheckCircleIcon, color: '#22c55e', borderColor: '#22c55e' },
    { label: 'Pendientes', value: stats.pendientes, icon: ClockIcon, color: '#f59e0b', borderColor: '#f59e0b' },
  ];

  if (loading) {
    return <div className="flex items-center justify-center py-16"><Spinner size="lg" /></div>;
  }

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Resumen de bitácoras asignadas" />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <Card key={c.label} borderColor={c.borderColor}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">{c.label}</p>
                  <p className="font-sora text-3xl font-bold text-gray-900 mt-1">{c.value}</p>
                </div>
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: `${c.color}20` }}
                >
                  <Icon className="w-6 h-6" style={{ color: c.color }} />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <Card>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-sora font-semibold text-gray-800">Bitácoras pendientes de revisión</h3>
            <p className="text-gray-500 text-sm mt-1">Revisa y comenta las bitácoras de los tutores</p>
          </div>
          <Link to="/revisor/bitacoras">
            <Button>Ver bitácoras</Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
