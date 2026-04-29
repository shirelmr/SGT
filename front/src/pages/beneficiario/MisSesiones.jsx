import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { CheckCircleIcon } from '@heroicons/react/24/outline';
import { getSesiones } from '../../api/sesiones';
import PageHeader from '../../components/shared/PageHeader';
import Badge from '../../components/ui/Badge';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';

const estadoBadge = {
  programada: 'info',
  realizada: 'success',
  cancelada: 'danger',
};

export default function MisSesionesBeneficiario() {
  const [sesiones, setSesiones] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSesiones()
      .then((r) => setSesiones(r.data || []))
      .catch(() => toast.error('Error al cargar sesiones'))
      .finally(() => setLoading(false));
  }, []);

  const sorted = [...sesiones].sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

  if (loading) {
    return <div className="flex items-center justify-center py-16"><Spinner size="lg" /></div>;
  }

  return (
    <div>
      <PageHeader
        title="Mis Sesiones"
        subtitle="Consulta tu historial de tutorías"
      />

      {sorted.length === 0 ? (
        <EmptyState icon="📅" title="Sin sesiones" description="Aún no tienes sesiones registradas." />
      ) : (
        <div className="space-y-3">
          {sorted.map((s) => (
            <div key={s.id} className="bg-white rounded-2xl shadow-sm p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h3 className="font-sora font-semibold text-gray-800 text-sm">{s.tema}</h3>
                  <Badge variant={estadoBadge[s.estado] || 'default'}>{s.estado}</Badge>
                  {s.confirma_benef && (
                    <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 rounded-full px-2 py-0.5 text-xs font-medium">
                      <CheckCircleIcon className="w-3 h-3" />
                      Asistencia confirmada
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500">
                  {new Date(s.fecha).toLocaleDateString('es-MX', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                  {s.tutor && ` • ${s.tutor.nombre_completo}`}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}