import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { PlusIcon, ChatBubbleLeftIcon } from '@heroicons/react/24/outline';
import { getSesiones } from '../../api/sesiones';
import PageHeader from '../../components/shared/PageHeader';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';

const estadoBadge = {
  programada: 'info',
  realizada: 'success',
  cancelada: 'danger',
};

export default function MisSesionesTutor() {
  const [sesiones, setSesiones] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

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
        subtitle="Administra tus sesiones de tutoría"
        right={
          <Button onClick={() => navigate('/tutor/sesiones/nueva')}>
            <PlusIcon className="w-4 h-4" />
            Nueva sesión
          </Button>
        }
      />

      {sorted.length === 0 ? (
        <EmptyState
          icon="📅"
          title="Sin sesiones"
          description="Aún no tienes sesiones registradas. Crea tu primera sesión."
          action={() => navigate('/tutor/sesiones/nueva')}
          actionLabel="Nueva sesión"
        />
      ) : (
        <div className="space-y-3">
          {sorted.map((s) => {
            const hasUnread = s.bitacora_tiene_comentarios_nuevos;
            return (
              <div key={s.id} className="bg-white rounded-2xl shadow-sm p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-sora font-semibold text-gray-800 text-sm">{s.tema}</h3>
                    <Badge variant={estadoBadge[s.estado] || 'default'}>{s.estado}</Badge>
                    {hasUnread && (
                      <span className="inline-flex items-center gap-1 bg-red-100 text-red-600 rounded-full px-2 py-0.5 text-xs font-medium">
                        <ChatBubbleLeftIcon className="w-3 h-3" />
                        Nuevo comentario
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(s.fecha).toLocaleDateString('es-MX', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                    {' • '}{s.hora_inicio}
                    {s.beneficiario && ` • ${s.beneficiario.nombre_completo || ''}`}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Link to={`/tutor/sesiones/${s.id}/bitacora`}>
                    <Button size="sm" variant={s.bitacora ? 'secondary' : 'primary'}>
                      {s.bitacora ? 'Ver bitácora' : 'Registrar bitácora'}
                    </Button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
