import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { getPeriodos } from '../../api/periodos';
import { getBeneficiariosPeriodo, getBeneficiariosAnteriores } from '../../api/beneficiarioPeriodo';
import PageHeader from '../../components/shared/PageHeader';
import Badge from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';
import Spinner from '../../components/ui/Spinner';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

function MiniBar({ value, total }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="flex items-center gap-2 min-w-[100px]">
      <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
        <div className="h-full rounded-full bg-orange-400 transition-all" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-gray-500 whitespace-nowrap">{value}/{total}</span>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-5 py-4">
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-400 mt-0.5">{label}</p>
    </div>
  );
}

export default function ProgresosBeneficiarios() {
  const [activePeriodoId, setActivePeriodoId] = useState(null);
  const [filtro, setFiltro] = useState('activo');
  const [beneficiarios, setBeneficiarios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [busqueda, setBusqueda] = useState('');

  useEffect(() => {
    getPeriodos()
      .then((r) => {
        const active = r.data.find((p) => p.activo);
        setActivePeriodoId(active?.id ?? null);
      })
      .catch(() => toast.error('Error al cargar periodos'));
  }, []);

  useEffect(() => {
    setLoading(true);
    setBusqueda('');
    const req = filtro === 'activo' && activePeriodoId
      ? getBeneficiariosPeriodo(activePeriodoId)
      : filtro === 'anteriores'
        ? getBeneficiariosAnteriores()
        : null;

    if (!req) { setLoading(false); return; }

    req
      .then((r) => setBeneficiarios(r.data))
      .catch(() => setBeneficiarios([]))
      .finally(() => setLoading(false));
  }, [filtro, activePeriodoId]);

  const filtered = beneficiarios.filter((b) =>
    b.nombre_completo?.toLowerCase().includes(busqueda.toLowerCase())
  );

  const sesionesEsperadas = beneficiarios[0]?.sesiones_esperadas ?? 0;
  const realizadas = beneficiarios.reduce((a, b) => a + (b.sesiones_realizadas ?? 0), 0);
  const conTutor = beneficiarios.filter((b) => b.tutor).length;

  return (
    <div className="space-y-5">
      <PageHeader title="Progreso de Beneficiarios" subtitle="Avance en sesiones y exámenes de inglés por beneficiario" />

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex rounded-xl border-2 border-gray-200 overflow-hidden text-sm">
          {[
            { key: 'activo', label: 'Periodo activo' },
            { key: 'anteriores', label: 'Periodos anteriores' },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFiltro(key)}
              className={`px-4 py-2 transition-colors ${
                filtro === key
                  ? 'bg-orange-500 text-white font-medium'
                  : 'bg-white text-gray-600 hover:bg-orange-50'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="relative">
          <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar beneficiario..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="pl-9 pr-3 py-2 text-sm border-2 border-gray-200 rounded-xl outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 w-52"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : beneficiarios.length === 0 ? (
        <EmptyState icon="👤" title="Sin beneficiarios" description={filtro === 'activo' ? 'No hay beneficiarios en el periodo activo' : 'No hay beneficiarios en periodos anteriores'} />
      ) : (
        <>
          {/* Summary stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard label="Beneficiarios" value={beneficiarios.length} />
            <StatCard label="Con tutor asignado" value={conTutor} />
            <StatCard label="Sesiones realizadas" value={realizadas} />
            <StatCard label="Sesiones esperadas por benef." value={sesionesEsperadas || '—'} />
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-y-auto max-h-[520px]">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-gray-50 z-10">
                  <tr className="border-b border-gray-100">
                    <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Beneficiario</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Tutor</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Sesiones realizadas / total</th>
                    <th className="text-center px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Examen inicio</th>
                    <th className="text-center px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Examen término</th>
                    <th className="text-center px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Avance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map((b) => {
                    const avance = b.pct_examen_inicio != null && b.pct_examen_termino != null
                      ? b.pct_examen_termino - b.pct_examen_inicio
                      : null;

                    return (
                      <tr key={b.id_benef} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-800">{b.nombre_completo}</p>
                          {b.escuela && <p className="text-xs text-gray-400 mt-0.5">{b.escuela}</p>}
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-gray-700">{b.tutor || <span className="text-gray-400 italic">Sin asignar</span>}</span>
                        </td>
                        <td className="px-4 py-3">
                          <MiniBar value={b.sesiones_realizadas} total={b.sesiones_esperadas} />
                          {b.sesiones_programadas > 0 && (
                            <p className="text-xs text-gray-400 mt-1">{b.sesiones_programadas} programada{b.sesiones_programadas !== 1 ? 's' : ''}</p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {b.pct_examen_inicio != null
                            ? <span className="text-blue-600 font-semibold">{b.pct_examen_inicio}%</span>
                            : <span className="text-gray-300 text-xs">—</span>}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {b.pct_examen_termino != null
                            ? <span className="text-green-600 font-semibold">{b.pct_examen_termino}%</span>
                            : <span className="text-gray-300 text-xs">—</span>}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {avance != null
                            ? <Badge variant={avance > 0 ? 'success' : avance < 0 ? 'danger' : 'default'}>
                                {avance > 0 ? '+' : ''}{avance.toFixed(1)}%
                              </Badge>
                            : <span className="text-gray-300 text-xs">—</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="border-t border-gray-100 px-4 py-2.5 bg-gray-50">
              <p className="text-xs text-gray-400">{filtered.length} beneficiario{filtered.length !== 1 ? 's' : ''}{busqueda ? ` · filtro: "${busqueda}"` : ''}</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
