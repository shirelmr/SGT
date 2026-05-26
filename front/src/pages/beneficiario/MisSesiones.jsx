import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
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

const FILTROS = [
  { valor: 'todas',      label: 'Todas' },
  { valor: 'programada', label: 'Programadas' },
  { valor: 'realizada',  label: 'Realizadas' },
  { valor: 'cancelada',  label: 'Canceladas' },
];

export default function MisSesionesBeneficiario() {
  const [sesiones, setSesiones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('todas');

  useEffect(() => {
    getSesiones()
      .then((r) => setSesiones(r.data || []))
      .catch(() => toast.error('Error al cargar sesiones'))
      .finally(() => setLoading(false));
  }, []);

  const sorted = [...sesiones].sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
  const filtradas = filtro === 'todas' ? sorted : sorted.filter((s) => s.estado === filtro);

  if (loading) {
    return <div className="flex items-center justify-center py-16"><Spinner size="lg" /></div>;
  }

  return (
    <div>
      <PageHeader
        title="Mis Sesiones"
        subtitle="Consulta tu historial de tutorías"
      />

      {/* Filtros */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {FILTROS.map((f) => (
          <button
            key={f.valor}
            onClick={() => setFiltro(f.valor)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition border
              ${filtro === f.valor
                ? 'bg-orange-500 text-white border-orange-500'
                : 'bg-white text-gray-600 border-gray-200 hover:border-orange-300 hover:text-orange-500'
              }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filtradas.length === 0 ? (
        <EmptyState
          icon="📅"
          title="Sin sesiones"
          description={`No tienes sesiones ${filtro === 'todas' ? 'registradas' : FILTROS.find(f => f.valor === filtro)?.label.toLowerCase()}.`}
        />
      ) : (
        <div className="space-y-3">
          {filtradas.map((s) => (
            <div key={s.id} className="bg-white rounded-2xl shadow-sm p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h3 className="font-sora font-semibold text-gray-800 text-sm">{s.tema}</h3>
                  <Badge variant={estadoBadge[s.estado] || 'default'}>{s.estado}</Badge>
                </div>
                <p className="text-xs text-gray-500">
                  {new Date(s.fecha).toLocaleDateString('es-MX', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                  {' • '}{s.hora_inicio}
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