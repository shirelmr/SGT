import { Link } from 'react-router-dom';
import { CalendarDaysIcon, LinkIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../hooks/useAuth';
import { useBeneficiarioDashboard } from '../../hooks/useBeneficiarioDashboard';
import PageHeader from '../../components/shared/PageHeader';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Spinner from '../../components/ui/Spinner';
import ProgressBar from '../../components/ui/ProgressBar';

const estadoBadge = {
  programada: 'info',
  realizada: 'success',
  cancelada: 'danger',
};

export default function BeneficiarioDashboard() {
  const { user } = useAuth();
  const { loading, progreso, avance, proxima, ultimas } = useBeneficiarioDashboard();

  if (loading) {
    return <div className="flex items-center justify-center py-16"><Spinner size="lg" /></div>;
  }

  return (
    <div>
      <PageHeader
        title={`¡Hola, ${user?.nombre_completo?.split(' ')[0]}!`}
        subtitle="Aquí está tu progreso en el programa"
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
              <p className="text-sm text-gray-800">
                <span className="font-medium">Tema:</span> {proxima.tema}
              </p>
              <p className="text-sm text-gray-800">
                <span className="font-medium">Tutor:</span> {proxima.tutor?.nombre_completo || '—'}
              </p>
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
            <p className="text-gray-400 text-sm">No hay sesiones próximas programadas.</p>
          )}
        </Card>

        {/* Progreso */}
        <Card title="Mi Progreso" borderColor="#22c55e">
          {progreso && avance != null ? (
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-500 mb-1">Avance general</p>
                <ProgressBar value={avance} />
              </div>
              {progreso.pct_examen_inicio != null && (
                <p className="text-xs text-gray-600">Inicio: <span className="font-semibold">{progreso.pct_examen_inicio}%</span></p>
              )}
              {progreso.pct_examen_termino != null && (
                <p className="text-xs text-gray-600">Término: <span className="font-semibold">{progreso.pct_examen_termino}%</span></p>
              )}
              <Link to="/beneficiario/progreso" className="text-orange-500 hover:underline text-xs font-medium">
                Ver detalles →
              </Link>
            </div>
          ) : (
            <p className="text-gray-400 text-sm">Sin datos de progreso aún.</p>
          )}
        </Card>
      </div>

      {/* Últimas sesiones */}
      <Card title="Últimas Sesiones">
        {ultimas.length === 0 ? (
          <p className="text-gray-400 text-sm">No hay sesiones registradas.</p>
        ) : (
          <ul className="divide-y divide-gray-50">
            {ultimas.map((s) => (
              <li key={s.id} className="py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-800">{s.tema}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(s.fecha).toLocaleDateString('es-MX')} • {s.tutor?.nombre_completo || 'Tutor'}
                  </p>
                </div>
                <Badge variant={estadoBadge[s.estado] || 'default'}>{s.estado}</Badge>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
