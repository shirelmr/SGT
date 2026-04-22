import { useAuth } from '../../hooks/useAuth';
import { useMiProgreso, getMotivacion } from '../../hooks/useMiProgreso';
import PageHeader from '../../components/shared/PageHeader';
import Card from '../../components/ui/Card';
import ProgressBar from '../../components/ui/ProgressBar';
import Spinner from '../../components/ui/Spinner';

export default function MiProgreso() {
  const { user } = useAuth();
  const { loading, progreso, avance } = useMiProgreso();

  if (loading) {
    return <div className="flex items-center justify-center py-16"><Spinner size="lg" /></div>;
  }

  return (
    <div>
      <PageHeader
        title="Mi Progreso"
        subtitle={`Seguimiento de tu desempeño académico`}
      />

      <div className="max-w-2xl space-y-4">
        {/* Examen inicio */}
        <Card title="Examen de Inicio" borderColor="#3b82f6">
          {progreso?.pct_examen_inicio != null ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-600 text-sm">Calificación</span>
                <span className="font-sora font-bold text-2xl text-gray-900">{progreso.pct_examen_inicio}%</span>
              </div>
              <ProgressBar value={progreso.pct_examen_inicio} />
              {progreso.fecha_examen_inicio && (
                <p className="text-xs text-gray-500">
                  Aplicado el: {new Date(progreso.fecha_examen_inicio).toLocaleDateString('es-MX')}
                </p>
              )}
            </div>
          ) : (
            <p className="text-gray-400 text-sm">Examen aún no aplicado.</p>
          )}
        </Card>

        {/* Examen término */}
        <Card title="Examen de Término" borderColor="#22c55e">
          {progreso?.pct_examen_termino != null ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-600 text-sm">Calificación</span>
                <span className="font-sora font-bold text-2xl text-gray-900">{progreso.pct_examen_termino}%</span>
              </div>
              <ProgressBar value={progreso.pct_examen_termino} />
              {progreso.fecha_examen_termino && (
                <p className="text-xs text-gray-500">
                  Aplicado el: {new Date(progreso.fecha_examen_termino).toLocaleDateString('es-MX')}
                </p>
              )}
            </div>
          ) : (
            <p className="text-gray-400 text-sm">Aún no aplicado.</p>
          )}
        </Card>

        {/* Avance general */}
        <Card title="Avance General" borderColor="#f97316">
          {avance != null ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600 text-sm">Progreso total</span>
                <span className="font-sora font-bold text-3xl text-gray-900">{avance}%</span>
              </div>
              <ProgressBar value={avance} />
              <p className="text-sm text-orange-600 font-medium mt-2">{getMotivacion(avance)}</p>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-gray-400 text-sm">El avance se calculará cuando tengas ambos exámenes registrados.</p>
              <p className="text-sm text-orange-500 font-medium">{getMotivacion(0)}</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
