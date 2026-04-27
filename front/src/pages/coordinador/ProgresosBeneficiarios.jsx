import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { getPeriodos } from '../../api/periodos';
import { getBeneficiariosPeriodo, registrarExamen } from '../../api/beneficiarioPeriodo';
import PageHeader from '../../components/shared/PageHeader';
import Table from '../../components/ui/Table';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Badge from '../../components/ui/Badge';
import ProgressBar from '../../components/ui/ProgressBar';
import EmptyState from '../../components/ui/EmptyState';

export default function ProgresosBeneficiarios() {
  const [periodos, setPeriodos] = useState([]);
  const [selectedPeriodo, setSelectedPeriodo] = useState('');
  const [beneficiarios, setBeneficiarios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedBeneficiario, setSelectedBeneficiario] = useState(null);
  const [saving, setSaving] = useState(false);

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
    setSelectedBeneficiario(b);
    reset({});
    setModalOpen(true);
  }

  async function onSubmit(data) {
    setSaving(true);
    try {
      await registrarExamen(selectedBeneficiario.id, data);
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

  const hasInicio = selectedBeneficiario?.pct_examen_inicio != null;
  const hasTermino = selectedBeneficiario?.pct_examen_termino != null;

  const computeAvance = (b) => {
    if (b.pct_examen_inicio == null || b.pct_examen_termino == null) return null;
    return b.pct_examen_termino - b.pct_examen_inicio;
  };

  const columns = [
    { key: 'nombre_completo', label: 'Nombre', render: (_, row) => row.beneficiario?.nombre_completo || row.nombre_completo || '—' },
    {
      key: 'pct_examen_inicio',
      label: 'Examen inicio',
      render: (v) => v != null ? <Badge variant="info">{v}%</Badge> : <Badge variant="default">Pendiente</Badge>,
    },
    {
      key: 'pct_examen_termino',
      label: 'Examen término',
      render: (v) => v != null ? <Badge variant="success">{v}%</Badge> : <Badge variant="default">Pendiente</Badge>,
    },
    {
      key: 'avance',
      label: 'Avance',
      render: (_, row) => {
        const avance = computeAvance(row);
        return avance != null ? <ProgressBar value={avance} /> : <span className="text-gray-400 text-sm">—</span>;
      },
    },
    {
      key: 'acciones',
      label: 'Acciones',
      render: (_, row) => (
        <Button size="sm" variant="outline" onClick={() => openExamen(row)}>
          Registrar examen
        </Button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Progreso de Beneficiarios" subtitle="Registra y consulta los exámenes de beneficiarios" />

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

      {!selectedPeriodo ? (
        <EmptyState icon="📈" title="Selecciona un periodo" description="Elige un periodo para ver el progreso" />
      ) : (
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <Table
            columns={columns}
            data={beneficiarios}
            loading={loading}
            emptyMessage="No hay beneficiarios en este periodo"
          />
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
          <p className="text-sm font-medium text-orange-800">
            {selectedBeneficiario?.beneficiario?.nombre_completo || selectedBeneficiario?.nombre_completo}
          </p>
          {hasInicio && (
            <p className="text-xs text-orange-600 mt-1">
              Examen inicio: {selectedBeneficiario.pct_examen_inicio}%
            </p>
          )}
        </div>
        <form id="examen-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {!hasInicio ? (
            <>
              <Input
                label="Porcentaje examen inicio"
                type="number"
                min="0"
                max="100"
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
          ) : !hasTermino ? (
            <>
              <Input
                label="Porcentaje examen término"
                type="number"
                min="0"
                max="100"
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
