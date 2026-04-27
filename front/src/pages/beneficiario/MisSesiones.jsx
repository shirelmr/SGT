import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { CheckCircleIcon } from '@heroicons/react/24/outline';
import { getSesiones } from '../../api/sesiones';
import { confirmarAsistencia } from '../../api/asistencias';
import PageHeader from '../../components/shared/PageHeader';
import Badge from '../../components/ui/Badge';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import Button from '../../components/ui/Button';

const estadoBadge = {
  programada: 'info',
  realizada: 'success',
  cancelada: 'danger',
};

export default function MisSesionesBeneficiario() {
  const [sesiones, setSesiones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState({});

  useEffect(() => {
    getSesiones()
      .then((r) => setSesiones(r.data || []))
      .catch(() => toast.error('Error al cargar sesiones'))
      .finally(() => setLoading(false));
  }, []);

  async function handleConfirmar(sesionId) {
    setConfirming((prev) => ({ ...prev, [sesionId]: true }));
    try {
      await confirmarAsistencia(sesionId);
      toast.success('Asistencia confirmada');
      setSesiones((prev) =>
        prev.map((s) => s.id === sesionId ? { ...s, confirma_benef: true } : s)
      );
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Error al confirmar');
    } finally {
      setConfirming((prev) => ({ ...prev, [sesionId]: false }));
    }
  }

  const sorted = [...sesiones].sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
  const now = new Date();

  if (loading) {
    return <div className="flex items-center justify-center py-16"><Spinner size="lg" /></div>;
  }

  return (
    <div>
      <PageHeader
        title="Mis Sesiones"
        subtitle="Consulta tus sesiones de tutoría"
      />

      {sorted.length === 0 ? (
        <EmptyState icon="📅" title="Sin sesiones" description="Aún no tienes sesiones registradas." />
      ) : (
        <div className="space-y-3">
          {sorted.map((s) => {
            const sesionPasada = new Date(s.fecha) <= now;
            const puedConfirmar = sesionPasada && s.estado === 'realizada' && !s.confirma_benef;

            return (
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
                    {' • '}{s.hora_inicio}
                    {s.tutor && ` • ${s.tutor.nombre_completo}`}
                  </p>
                </div>
                {puedConfirmar && (
                  <Button
                    size="sm"
                    onClick={() => handleConfirmar(s.id)}
                    loading={confirming[s.id]}
                  >
                    Confirmar asistencia
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
