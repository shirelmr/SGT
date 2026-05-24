import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { getPeriodos } from '../../api/periodos';
import { getUsuarios, updateUsuario, asignarAutomatico, asignarRevisoresAutomatico } from '../../api/usuarios';
import PageHeader from '../../components/shared/PageHeader';
import Spinner from '../../components/ui/Spinner';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';

function Avatar({ name, color = 'orange' }) {
  const colors = {
    orange: 'bg-orange-100 text-orange-600',
    green: 'bg-green-100 text-green-600',
    blue: 'bg-blue-100 text-blue-600',
  };
  return (
    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 ${colors[color]}`}>
      {name?.[0]?.toUpperCase() || '?'}
    </div>
  );
}

function InfoPill({ value, label }) {
  return (
    <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-lg px-2.5 py-1">
      <span className="text-sm font-bold text-gray-900">{value}</span>
      <span className="text-xs text-gray-400">{label}</span>
    </div>
  );
}

function AutoAssignPanel({ title, countA, labelA, countB, labelB, porCada, setPorCada, onAssign, assigning, disabled }) {
  const capacidad = countA * porCada;
  const sinAsignar = countB;
  const seAsignaran = Math.min(capacidad, sinAsignar);
  const quedaranSin = Math.max(0, sinAsignar - capacidad);
  const todosAsignados = sinAsignar === 0;

  return (
    <div className="bg-orange-50 border border-orange-100 rounded-2xl p-5 space-y-4">
      <p className="text-sm font-semibold text-gray-700">{title}</p>

      {/* Input */}
      <div className="flex items-center gap-3">
        <label className="text-sm text-gray-600 whitespace-nowrap">{labelB === 'sin tutor' ? 'Beneficiarios' : 'Tutores'} por {labelA === 'tutores' ? 'tutor' : 'revisor'}:</label>
        <input
          type="number"
          min={1}
          value={porCada}
          onChange={(e) => setPorCada(Number(e.target.value))}
          className="border-2 border-gray-200 rounded-xl px-3 py-1.5 text-sm w-20 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 bg-white"
        />
      </div>

      {/* Desglose visual */}
      <div className="flex items-center gap-2 flex-wrap">
        <InfoPill value={countA} label={labelA} />
        <span className="text-gray-400 font-medium text-sm">×</span>
        <InfoPill value={porCada} label={`c/u puede tomar`} />
        <span className="text-gray-400 font-medium text-sm">=</span>
        <InfoPill value={capacidad} label="cupos disponibles" />
      </div>

      {/* Estado actual */}
      <div className="space-y-1.5 text-sm">
        {todosAsignados ? (
          <p className="text-green-600 font-medium">Todos ya tienen asignación, no hay pendientes.</p>
        ) : (
          <>
            <p className="text-gray-600">
              <span className="font-semibold text-gray-800">{sinAsignar}</span> {labelB} →{' '}
              se asignarán <span className="font-semibold text-orange-600">{seAsignaran}</span>
            </p>
            {quedaranSin > 0 && (
              <p className="text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs">
                <strong>{quedaranSin}</strong> {labelB === 'sin tutor' ? 'beneficiario' : 'tutor'}{quedaranSin !== 1 ? 's' : ''} quedarán sin asignar porque no hay suficientes cupos. Aumenta el número por {labelA === 'tutores' ? 'tutor' : 'revisor'} o agrega más {labelA} al periodo.
              </p>
            )}
          </>
        )}
      </div>

      <div className="flex justify-end">
        <Button onClick={onAssign} disabled={disabled || assigning || countA === 0 || todosAsignados}>
          {assigning ? 'Asignando...' : 'Asignar automáticamente'}
        </Button>
      </div>
    </div>
  );
}

export default function Asignaciones() {
  const [periodos, setPeriodos] = useState([]);
  const [selectedPeriodo, setSelectedPeriodo] = useState('');
  const [tutores, setTutores] = useState([]);
  const [beneficiarios, setBeneficiarios] = useState([]);
  const [revisores, setRevisores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState({});
  const [savingRevisor, setSavingRevisor] = useState({});
  const [porTutor, setPorTutor] = useState(5);
  const [porRevisor, setPorRevisor] = useState(3);
  const [assigning, setAssigning] = useState(false);
  const [assigningRevisores, setAssigningRevisores] = useState(false);

  useEffect(() => {
    getPeriodos()
      .then((r) => {
        setPeriodos(r.data);
        const active = r.data.find((p) => p.activo);
        if (active) setSelectedPeriodo(String(active.id));
      })
      .catch(() => toast.error('Error al cargar periodos'));
  }, []);

  function cargarUsuarios(periodoId) {
    return getUsuarios().then((r) => {
      const all = r.data;
      setTutores(all.filter((u) => u.rol === 'tutor' && String(u.id_periodo) === periodoId));
      setBeneficiarios(all.filter((u) => u.rol === 'beneficiario' && String(u.id_periodo) === periodoId));
      setRevisores(all.filter((u) => u.rol === 'revisor' && String(u.id_periodo) === periodoId));
    });
  }

  useEffect(() => {
    if (!selectedPeriodo) return;
    setLoading(true);
    cargarUsuarios(selectedPeriodo)
      .catch(() => toast.error('Error al cargar usuarios'))
      .finally(() => setLoading(false));
  }, [selectedPeriodo]);

  async function handleAutoAssign() {
    if (!selectedPeriodo) return;
    setAssigning(true);
    try {
      const r = await asignarAutomatico(porTutor);
      const { asignados } = r.data;
      if (asignados === 0) toast('Todos los beneficiarios ya tienen tutor asignado');
      else toast.success(`${asignados} beneficiario${asignados !== 1 ? 's' : ''} asignado${asignados !== 1 ? 's' : ''}`);
      await cargarUsuarios(selectedPeriodo);
    } catch {
      toast.error('Error al asignar automáticamente');
    } finally {
      setAssigning(false);
    }
  }

  async function handleAutoAssignRevisores() {
    if (!selectedPeriodo) return;
    setAssigningRevisores(true);
    try {
      const r = await asignarRevisoresAutomatico(porRevisor);
      const { asignados } = r.data;
      if (asignados === 0) toast('Todos los tutores ya tienen revisor asignado');
      else toast.success(`${asignados} tutor${asignados !== 1 ? 'es' : ''} asignado${asignados !== 1 ? 's' : ''}`);
      await cargarUsuarios(selectedPeriodo);
    } catch {
      toast.error('Error al asignar automáticamente');
    } finally {
      setAssigningRevisores(false);
    }
  }

  async function handleAssign(beneficiarioId, tutorId) {
    setSaving((prev) => ({ ...prev, [beneficiarioId]: true }));
    try {
      await updateUsuario(beneficiarioId, { id_tutor: tutorId || null });
      toast.success('Asignación actualizada');
      await cargarUsuarios(selectedPeriodo);
    } catch {
      toast.error('Error al asignar');
    } finally {
      setSaving((prev) => ({ ...prev, [beneficiarioId]: false }));
    }
  }

  async function handleAssignRevisor(tutorUserId, revisorId) {
    setSavingRevisor((prev) => ({ ...prev, [tutorUserId]: true }));
    try {
      await updateUsuario(tutorUserId, { id_revisor: revisorId || null });
      toast.success('Asignación actualizada');
      await cargarUsuarios(selectedPeriodo);
    } catch {
      toast.error('Error al asignar');
    } finally {
      setSavingRevisor((prev) => ({ ...prev, [tutorUserId]: false }));
    }
  }

  const tutoresPorRevisor = revisores.reduce((acc, rev) => {
    acc[rev.id_revisor] = tutores.filter((t) => t.id_revisor === rev.id_revisor).length;
    return acc;
  }, {});

  const benefSinTutor = beneficiarios.filter((b) => !b.id_tutor).length;
  const tutoresSinRevisor = tutores.filter((t) => !t.id_revisor).length;

  return (
    <div>
      <PageHeader title="Asignaciones" subtitle="Asigna tutores a beneficiarios y revisores a tutores por periodo" />

      <div className="mb-6">
        <label className="text-sm font-medium text-gray-700 block mb-1">Periodo</label>
        <select
          value={selectedPeriodo}
          onChange={(e) => setSelectedPeriodo(e.target.value)}
          className="border-2 border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
        >
          <option value="">Seleccionar periodo</option>
          {periodos.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16"><Spinner size="lg" /></div>
      ) : !selectedPeriodo ? (
        <EmptyState icon="📅" title="Selecciona un periodo" description="Elige un periodo para ver las asignaciones" />
      ) : (
        <>
          {/* ── Sección: Tutores → Beneficiarios ── */}
          <p className="text-base font-semibold text-gray-800 mb-3">Tutores a beneficiarios</p>

          <AutoAssignPanel
            title="Asignación automática — tutores a beneficiarios"
            countA={tutores.length}
            labelA="tutores"
            countB={benefSinTutor}
            labelB="sin tutor"
            porCada={porTutor}
            setPorCada={setPorTutor}
            onAssign={handleAutoAssign}
            assigning={assigning}
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6 mb-10">
            <Card title={`Tutores (${tutores.length})`}>
              {tutores.length === 0 ? (
                <p className="text-gray-400 text-sm">No hay tutores en este periodo</p>
              ) : (
                <ul className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {tutores.map((t) => (
                    <li key={t.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                      <Avatar name={t.nombre_completo} color="orange" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{t.nombre_completo}</p>
                        <p className="text-xs text-gray-500 truncate">{t.carrera || '—'} · Sem. {t.semestre || '—'}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <Card title={`Beneficiarios (${beneficiarios.length})`}>
              {beneficiarios.length === 0 ? (
                <p className="text-gray-400 text-sm">No hay beneficiarios en este periodo</p>
              ) : (
                <ul className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {beneficiarios.map((b) => (
                    <li key={b.id} className="p-3 rounded-xl bg-gray-50 space-y-2">
                      <div className="flex items-center gap-2">
                        <Avatar name={b.nombre_completo} color="green" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">{b.nombre_completo}</p>
                          <p className="text-xs text-gray-500 truncate">{b.escuela || '—'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <select
                          defaultValue={b.id_tutor || ''}
                          onChange={(e) => handleAssign(b.id, e.target.value)}
                          disabled={saving[b.id]}
                          className="flex-1 border-2 border-gray-200 rounded-xl px-2 py-1.5 text-xs outline-none focus:border-orange-400"
                        >
                          <option value="">Sin tutor asignado</option>
                          {tutores.map((t) => <option key={t.id} value={t.id_tutor}>{t.nombre_completo}</option>)}
                        </select>
                        {saving[b.id] && <Spinner size="sm" />}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>

          {/* ── Separador ── */}
          <div className="border-t border-gray-200 mb-8" />

          {/* ── Sección: Revisores → Tutores ── */}
          <p className="text-base font-semibold text-gray-800 mb-3">Revisores a tutores</p>

          <AutoAssignPanel
            title="Asignación automática — revisores a tutores"
            countA={revisores.length}
            labelA="revisores"
            countB={tutoresSinRevisor}
            labelB="sin revisor"
            porCada={porRevisor}
            setPorCada={setPorRevisor}
            onAssign={handleAutoAssignRevisores}
            assigning={assigningRevisores}
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            <Card title={`Revisores (${revisores.length})`}>
              {revisores.length === 0 ? (
                <p className="text-gray-400 text-sm">No hay revisores en este periodo</p>
              ) : (
                <ul className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {revisores.map((rev) => (
                    <li key={rev.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                      <Avatar name={rev.nombre_completo} color="blue" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{rev.nombre_completo}</p>
                        <p className="text-xs text-gray-500 truncate">{rev.carrera || '—'} · Sem. {rev.semestre || '—'}</p>
                      </div>
                      <div className="text-xs font-semibold text-orange-600 bg-orange-50 px-2 py-1 rounded-lg flex-shrink-0">
                        {tutoresPorRevisor[rev.id_revisor] || 0} tutor{tutoresPorRevisor[rev.id_revisor] !== 1 ? 'es' : ''}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <Card title={`Tutores (${tutores.length})`}>
              {tutores.length === 0 ? (
                <p className="text-gray-400 text-sm">No hay tutores en este periodo</p>
              ) : (
                <ul className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {tutores.map((t) => (
                    <li key={t.id} className="p-3 rounded-xl bg-gray-50 space-y-2">
                      <div className="flex items-center gap-2">
                        <Avatar name={t.nombre_completo} color="orange" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">{t.nombre_completo}</p>
                          <p className="text-xs text-gray-500 truncate">{t.carrera || '—'} · Sem. {t.semestre || '—'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <select
                          defaultValue={t.id_revisor || ''}
                          onChange={(e) => handleAssignRevisor(t.id, e.target.value)}
                          disabled={savingRevisor[t.id]}
                          className="flex-1 border-2 border-gray-200 rounded-xl px-2 py-1.5 text-xs outline-none focus:border-orange-400"
                        >
                          <option value="">Sin revisor asignado</option>
                          {revisores.map((rev) => (
                            <option key={rev.id} value={rev.id_revisor}>{rev.nombre_completo}</option>
                          ))}
                        </select>
                        {savingRevisor[t.id] && <Spinner size="sm" />}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
