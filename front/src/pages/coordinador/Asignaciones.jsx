import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { getPeriodos } from '../../api/periodos';
import { getUsuarios, updateUsuario } from '../../api/usuarios';
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
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState({});

  useEffect(() => {
    getPeriodos()
      .then((r) => {
        setPeriodos(r.data);
        const active = r.data.find((p) => p.activo);
        if (active) setSelectedPeriodo(String(active.id));
      })
      .catch(() => toast.error('Error al cargar periodos'));
  }, []);

  useEffect(() => {
    if (!selectedPeriodo) return;
    setLoading(true);
    getUsuarios()
      .then((r) => {
        const all = r.data;
        setTutores(all.filter((u) => u.rol === 'tutor' && String(u.id_periodo) === selectedPeriodo));
        setBeneficiarios(all.filter((u) => u.rol === 'beneficiario' && String(u.id_periodo) === selectedPeriodo));
      })
      .catch(() => toast.error('Error al cargar usuarios'))
      .finally(() => setLoading(false));
  }, [selectedPeriodo]);

  async function handleAssign(beneficiarioId, tutorId) {
    setSaving((prev) => ({ ...prev, [beneficiarioId]: true }));
    try {
      await updateUsuario(beneficiarioId, { id_tutor: tutorId || null });
      toast.success('Asignación actualizada');
      const r = await getUsuarios();
      setBeneficiarios(r.data.filter((u) => u.rol === 'beneficiario' && String(u.id_periodo) === selectedPeriodo));
    } catch {
      toast.error('Error al asignar');
    } finally {
      setSaving((prev) => ({ ...prev, [beneficiarioId]: false }));
    }
  }

  return (
    <div>
      <PageHeader title="Asignaciones" subtitle="Asigna tutores a beneficiarios por periodo" />

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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                {beneficiarios.map((b) => {
                  const assignedTutor = tutores.find((t) => t.id === b.id_tutor);
                  return (
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
                          {tutores.map((t) => <option key={t.id} value={t.id}>{t.nombre_completo}</option>)}
                        </select>
                        {saving[b.id] && <Spinner size="sm" />}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
