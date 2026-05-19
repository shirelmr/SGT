import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { getPeriodos } from '../../api/periodos';
import { getUsuarios, updateUsuario, asignarAutomatico, asignarRevisoresAutomatico } from '../../api/usuarios';
import PageHeader from '../../components/shared/PageHeader';
import Spinner from '../../components/ui/Spinner';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';

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
      if (asignados === 0) {
        toast('Todos los beneficiarios ya tienen tutor asignado');
      } else {
        toast.success(`${asignados} beneficiario${asignados !== 1 ? 's' : ''} asignado${asignados !== 1 ? 's' : ''} automáticamente`);
      }
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
      if (asignados === 0) {
        toast('Todos los tutores ya tienen revisor asignado');
      } else {
        toast.success(`${asignados} tutor${asignados !== 1 ? 'es' : ''} asignado${asignados !== 1 ? 's' : ''} automáticamente`);
      }
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

  const sinRevisor = tutores.filter((t) => !t.id_revisor).length;

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
          <p className="text-base font-semibold text-gray-700 mb-3">Tutores a beneficiarios</p>

          <div className="mb-6 flex items-end gap-3 p-4 bg-orange-50 border border-orange-100 rounded-2xl">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Beneficiarios por tutor</label>
              <input
                type="number"
                min={1}
                value={porTutor}
                onChange={(e) => setPorTutor(Number(e.target.value))}
                className="border-2 border-gray-200 rounded-xl px-3 py-2 text-sm w-24 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
              />
            </div>
            <div className="text-xs text-gray-500 pb-2">
              {tutores.length > 0 && (
                <>Se asignarán hasta <strong>{tutores.length * porTutor}</strong> beneficiarios sin tutor ({tutores.length} tutores × {porTutor})</>
              )}
            </div>
            <div className="ml-auto">
              <Button onClick={handleAutoAssign} disabled={assigning || tutores.length === 0}>
                {assigning ? 'Asignando...' : 'Asignar automáticamente'}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
            <Card title={`Tutores (${tutores.length})`}>
              {tutores.length === 0 ? (
                <p className="text-gray-400 text-sm">No hay tutores en este periodo</p>
              ) : (
                <ul className="space-y-2">
                  {tutores.map((t) => (
                    <li key={t.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                      <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-sm font-semibold">
                        {t.nombre_completo?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800">{t.nombre_completo}</p>
                        <p className="text-xs text-gray-500">{t.carrera || '—'} • Sem. {t.semestre || '—'}</p>
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
                <ul className="space-y-3">
                  {beneficiarios.map((b) => (
                    <li key={b.id} className="p-3 rounded-xl bg-gray-50">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-sm font-semibold">
                          {b.nombre_completo?.[0]?.toUpperCase() || '?'}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-800">{b.nombre_completo}</p>
                          <p className="text-xs text-gray-500">{b.escuela || '—'}</p>
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
          <p className="text-base font-semibold text-gray-700 mb-3">Revisores a tutores</p>

          <div className="mb-6 flex items-end gap-3 p-4 bg-orange-50 border border-orange-100 rounded-2xl">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Tutores por revisor</label>
              <input
                type="number"
                min={1}
                value={porRevisor}
                onChange={(e) => setPorRevisor(Number(e.target.value))}
                className="border-2 border-gray-200 rounded-xl px-3 py-2 text-sm w-24 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
              />
            </div>
            <div className="text-xs text-gray-500 pb-2">
              {revisores.length > 0 && (
                <>Se asignarán hasta <strong>{revisores.length * porRevisor}</strong> tutores sin revisor ({revisores.length} revisores × {porRevisor})</>
              )}
              {sinRevisor > 0 && (
                <span className="ml-2 text-amber-600 font-medium">· {sinRevisor} tutor{sinRevisor !== 1 ? 'es' : ''} sin revisor</span>
              )}
            </div>
            <div className="ml-auto">
              <Button onClick={handleAutoAssignRevisores} disabled={assigningRevisores || revisores.length === 0}>
                {assigningRevisores ? 'Asignando...' : 'Asignar automáticamente'}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card title={`Revisores (${revisores.length})`}>
              {revisores.length === 0 ? (
                <p className="text-gray-400 text-sm">No hay revisores en este periodo</p>
              ) : (
                <ul className="space-y-2">
                  {revisores.map((rev) => (
                    <li key={rev.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-semibold">
                        {rev.nombre_completo?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-800">{rev.nombre_completo}</p>
                        <p className="text-xs text-gray-500">{rev.carrera || '—'} • Sem. {rev.semestre || '—'}</p>
                      </div>
                      <div className="text-xs font-semibold text-orange-600 bg-orange-50 px-2 py-1 rounded-lg">
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
                <ul className="space-y-3">
                  {tutores.map((t) => (
                    <li key={t.id} className="p-3 rounded-xl bg-gray-50">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-sm font-semibold">
                          {t.nombre_completo?.[0]?.toUpperCase() || '?'}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-800">{t.nombre_completo}</p>
                          <p className="text-xs text-gray-500">{t.carrera || '—'} • Sem. {t.semestre || '—'}</p>
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
