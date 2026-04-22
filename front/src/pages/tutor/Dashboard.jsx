import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useTutorDashboard } from '../../hooks/useTutorDashboard';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Spinner from '../../components/ui/Spinner';
import PageHeader from '../../components/shared/PageHeader';
import { CalendarDaysIcon, ClockIcon, LinkIcon, ChatBubbleLeftIcon } from '@heroicons/react/24/outline';

const estadoBadge = {
  programada: 'info',
  realizada: 'success',
  cancelada: 'danger',
};

export default function TutorDashboard() {
  const { user } = useAuth();
  const { loading, horas, proxima, ultimasTres } = useTutorDashboard();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={`¡Hola, ${user?.nombre_completo?.split(' ')[0]}!`}
        subtitle="Aquí está el resumen de tu actividad"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* Próxima sesión */}
        <Card title="Próxima Sesión" borderColor="#f97316" className="lg:col-span-2">
          {proxima ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <CalendarDaysIcon className="w-4 h-4 text-orange-500" />
                <span>{new Date(proxima.fecha).toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <ClockIcon className="w-4 h-4 text-orange-500" />
                <span>{proxima.hora_inicio} • {proxima.duracion_hrs} hora(s)</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className="font-medium text-gray-800">Tema:</span>
                <span>{proxima.tema}</span>
              </div>
              {proxima.link_sesion && (
                <a
                  href={proxima.link_sesion}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-orange-500 hover:text-orange-600 text-sm font-medium"
                >
                  <LinkIcon className="w-4 h-4" />
                  Unirse a la sesión
                </a>
              )}
            </div>
          ) : (
            <p className="text-gray-400 text-sm">No hay sesiones programadas próximamente.</p>
          )}
        </Card>

        {/* Horas acreditadas */}
        <Card title="Horas Periodo Actual" borderColor="#22c55e">
          <div className="text-center py-2">
            <p className="font-sora text-5xl font-bold text-gray-900">
              {horas?.horas_impartidas ?? 0}
            </p>
            <p className="text-gray-500 text-sm mt-1">horas impartidas</p>
            {horas?.porcentaje_acreditado != null && (
              <p className="text-orange-500 font-semibold mt-3">
                {horas.porcentaje_acreditado}% acreditado
              </p>
            )}
          </div>
        </Card>
      </div>

      {/* Últimas sesiones */}
      <Card title="Últimas Sesiones">
        {ultimasTres.length === 0 ? (
          <p className="text-gray-400 text-sm">No hay sesiones registradas aún.</p>
        ) : (
          <ul className="divide-y divide-gray-50">
            {ultimasTres.map((s) => (
              <li key={s.id} className="py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-800">{s.tema}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(s.fecha).toLocaleDateString('es-MX')} • {s.hora_inicio}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {s.bitacora_tiene_comentarios_nuevos && (
                    <ChatBubbleLeftIcon className="w-4 h-4 text-red-500" />
                  )}
                  <Badge variant={estadoBadge[s.estado] || 'default'}>{s.estado}</Badge>
                  <Link
                    to={`/tutor/sesiones/${s.id}/bitacora`}
                    className="text-xs text-orange-500 hover:underline font-medium"
                  >
                    Ver bitácora
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
