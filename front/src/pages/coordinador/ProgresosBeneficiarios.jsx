import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { getPeriodos } from '../../api/periodos';
import { getBeneficiariosPeriodo, registrarExamen } from '../../api/beneficiarioPeriodo';
import PageHeader from '../../components/shared/PageHeader';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Badge from '../../components/ui/Badge';
import ProgressBar from '../../components/ui/ProgressBar';
import EmptyState from '../../components/ui/EmptyState';
import Spinner from '../../components/ui/Spinner';

function SessionBar({ realizadas, total }) {
  const pct = total > 0 ? Math.round((realizadas / total) * 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
        <div
          className="h-full rounded-full bg-orange-400 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-gray-500 whitespace-nowrap">{realizadas}/{total}</span>
    </div>
  );
}

export default function ProgresosBeneficiarios() {
  const [periodos, setPeriodos] = useState([]);
  const [selectedPeriodo, setSelectedPeriodo] = useState('');
  const [beneficiarios, setBeneficiarios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedBenef, setSelectedBenef] = useState(null);
  const [saving, setSaving] = useState(false);
  const [busqueda, setBusqueda] = useState('');

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

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
    getBeneficiariosPeriodo(selectedPeriodo)
      .then((r) => setBeneficiarios(r.data))
      .catch(() => setBeneficiarios([]))
      .finally(() => setLoading(false));
  }, [selectedPeriodo]);

  function openExamen(b) {
    setSelectedBenef(b);
    reset({});
    setModalOpen(true);
  }

  async function onSubmit(data) {
    setSaving(true);
    try {
      await registrarExamen(selectedBenef.id_benef, selectedPeriodo, data);
      toast.success('Examen registrado');
      setModalOpen(false);
      const r = await getBeneficiariosPeriodo(selectedPeriodo);
      setBeneficiarios(r.data);
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Error al registrar');
    } finally {
      setSaving(false);
    }
  }

  const filtered = beneficiarios.filter((b) =>
    b.nombre_completo?.toLowerCase().includes(busqueda.toLowerCase())
  );

  const hasInicio = selectedBenef?.pct_examen_inicio != null;
  const hasTermino = selectedBenef?.pct_examen_termino != null;

  return (
    <div>
      <PageHeader title="Progreso de Beneficiarios" subtitle="Sesiones, avance y exámenes por beneficiario" />

      <div className="flex flex-wrap gap-3 mb-6">
        <select
          value={selectedPeriodo}
          onChange={(e) => setSelectedPeriodo(e.target.value)}
          className="border-2 border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-orange-400"
        >
          <option value="">Seleccionar periodo</option>
          {periodos.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
        </select>

        {selectedPeriodo && (
          <input
            type="text"
            placeholder="Buscar beneficiario..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="border-2 border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-orange-400 w-52"
          />
        )}
      </div>

      {!selectedPeriodo ? (
        <EmptyState icon="📈" title="Selecciona un periodo" description="Elige un periodo para ver el progreso" />
      ) : loading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : filtered.length === 0 ? (
        <EmptyState icon="👤" title="Sin beneficiarios" description="No hay beneficiarios en este periodo" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((b) => {
            const avance = b.pct_examen_inicio != null && b.pct_examen_termino != null
              ? b.pct_examen_termino - b.pct_examen_inicio
              : null;

            return (
              <div key={b.id_benef} className="bg-white rounded-2xl shadow-sm p-5 flex flex-col gap-4">
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{b.nombre_completo}</p>
                    <p className="text-xs text-gray-400">{b.email}</p>
                    {b.escuela && <p className="text-xs text-gray-400 mt-0.5">{b.escuela}{b.grado_escolar ? ` · ${b.grado_escolar}` : ''}</p>}
                  </div>
                  {avance != null && (
                    <Badge variant={avance > 0 ? 'success' : 'warning'}>
                      {avance > 0 ? `+${avance.toFixed(1)}%` : `${avance.toFixed(1)}%`}
                    </Badge>
                  )}
                </div>

                {/* Tutor */}
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <span className="text-gray-400">Tutor:</span>
                  <span className="font-medium text-gray-700">{b.tutor || '—'}</span>
                </div>

                {/* Sessions */}
                <div>
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Sesiones realizadas</span>
                    <span className="font-medium text-gray-700">{b.sesiones_realizadas} de {b.sesiones_total}</span>
                  </div>
                  <SessionBar realizadas={b.sesiones_realizadas} total={b.sesiones_total} />
                  {b.sesiones_programadas > 0 && (
                    <p className="text-xs text-gray-400 mt-1">{b.sesiones_programadas} programada{b.sesiones_programadas !== 1 ? 's' : ''}</p>
                  )}
                </div>

                {/* Exam scores */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-gray-50 rounded-xl p-2 text-center">
                    <p className="text-xs text-gray-400 mb-1">Examen inicio</p>
                    {b.pct_examen_inicio != null
                      ? <p className="text-lg font-bold text-blue-600">{b.pct_examen_inicio}%</p>
                      : <p className="text-xs text-gray-400">Pendiente</p>}
                  </div>
                  <div className="bg-gray-50 rounded-xl p-2 text-center">
                    <p className="text-xs text-gray-400 mb-1">Examen término</p>
                    {b.pct_examen_termino != null
                      ? <p className="text-lg font-bold text-green-600">{b.pct_examen_termino}%</p>
                      : <p className="text-xs text-gray-400">Pendiente</p>}
                  </div>
                </div>

                {/* Avance bar */}
                {avance != null && (
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Avance general</p>
                    <ProgressBar value={Math.max(0, avance)} />
                  </div>
                )}

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => openExamen(b)}
                  disabled={b.pct_examen_inicio != null && b.pct_examen_termino != null}
                  className="w-full mt-auto"
                >
                  {b.pct_examen_inicio == null
                    ? 'Registrar examen inicio'
                    : b.pct_examen_termino == null
                    ? 'Registrar examen término'
                    : 'Exámenes completos'}
                </Button>
              </div>
            );
          })}
        </div>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Registrar examen"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button type="submit" form="examen-form" loading={saving}>Guardar</Button>
          </>
        }
      >
        <div className="mb-4 p-3 bg-orange-50 rounded-xl">
          <p className="text-sm font-medium text-orange-800">{selectedBenef?.nombre_completo}</p>
          {selectedBenef?.pct_examen_inicio != null && (
            <p className="text-xs text-orange-600 mt-1">Examen inicio: {selectedBenef.pct_examen_inicio}%</p>
          )}
        </div>
        <form id="examen-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {selectedBenef?.pct_examen_inicio == null ? (
            <>
              <Input
                label="Porcentaje examen inicio"
                type="number" min="0" max="100"
                error={errors.pct_examen_inicio?.message}
                {...register('pct_examen_inicio', { required: 'Obligatorio', min: 0, max: 100 })}
              />
              <Input
                label="Fecha examen inicio"
                type="date"
                error={errors.fecha_examen_inicio?.message}
                {...register('fecha_examen_inicio', { required: 'Obligatorio' })}
              />
            </>
          ) : selectedBenef?.pct_examen_termino == null ? (
            <>
              <Input
                label="Porcentaje examen término"
                type="number" min="0" max="100"
                error={errors.pct_examen_termino?.message}
                {...register('pct_examen_termino', { required: 'Obligatorio', min: 0, max: 100 })}
              />
              <Input
                label="Fecha examen término"
                type="date"
                error={errors.fecha_examen_termino?.message}
                {...register('fecha_examen_termino', { required: 'Obligatorio' })}
              />
            </>
          ) : (
            <p className="text-sm text-gray-500">Ambos exámenes ya han sido registrados.</p>
          )}
        </form>
      </Modal>
    </div>
  );
}
