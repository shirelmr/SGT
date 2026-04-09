import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { PlusIcon, PencilIcon, TrashIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { getPeriodos, createPeriodo, updatePeriodo, deletePeriodo } from '../../api/periodos';
import PageHeader from '../../components/shared/PageHeader';
import Button from '../../components/ui/Button';
import Table from '../../components/ui/Table';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Badge from '../../components/ui/Badge';
import ConfirmDialog from '../../components/shared/ConfirmDialog';

export default function Periodos() {
  const [periodos, setPeriodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editPeriodo, setEditPeriodo] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [warning, setWarning] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm();

  const watchActivo = watch('activo');

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    if (watchActivo) {
      const hasActive = periodos.some((p) => p.activo && p.id !== editPeriodo?.id);
      if (hasActive) {
        setWarning('Ya existe un periodo activo. Activar este desactivará el anterior.');
      } else {
        setWarning('');
      }
    } else {
      setWarning('');
    }
  }, [watchActivo, periodos, editPeriodo]);

  async function loadData() {
    setLoading(true);
    try {
      const res = await getPeriodos();
      setPeriodos(res.data);
    } catch {
      toast.error('Error al cargar periodos');
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setEditPeriodo(null);
    reset({ activo: false });
    setModalOpen(true);
  }

  function openEdit(p) {
    setEditPeriodo(p);
    reset({ ...p });
    setModalOpen(true);
  }

  function openDelete(p) {
    setDeleteTarget(p);
    setConfirmOpen(true);
  }

  async function onSubmit(data) {
    setSaving(true);
    try {
      if (editPeriodo) {
        await updatePeriodo(editPeriodo.id, data);
        toast.success('Periodo actualizado');
      } else {
        await createPeriodo(data);
        toast.success('Periodo creado');
      }
      setModalOpen(false);
      loadData();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await deletePeriodo(deleteTarget.id);
      toast.success('Periodo eliminado');
      setConfirmOpen(false);
      loadData();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Error al eliminar');
    } finally {
      setDeleting(false);
    }
  }

  const columns = [
    { key: 'nombre', label: 'Nombre' },
    {
      key: 'fecha_inicio',
      label: 'Fecha inicio',
      render: (v) => v ? new Date(v).toLocaleDateString('es-MX') : '—',
    },
    {
      key: 'fecha_fin',
      label: 'Fecha fin',
      render: (v) => v ? new Date(v).toLocaleDateString('es-MX') : '—',
    },
    { key: 'horas_max', label: 'Horas máx.' },
    {
      key: 'activo',
      label: 'Estado',
      render: (v) => <Badge variant={v ? 'success' : 'default'}>{v ? 'Activo' : 'Inactivo'}</Badge>,
    },
    {
      key: 'acciones',
      label: 'Acciones',
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <button onClick={() => openEdit(row)} className="p-1.5 rounded-lg hover:bg-orange-50 text-orange-500 transition-colors">
            <PencilIcon className="w-4 h-4" />
          </button>
          <button onClick={() => openDelete(row)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors">
            <TrashIcon className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Periodos"
        subtitle="Gestiona los periodos académicos"
        right={
          <Button onClick={openCreate}>
            <PlusIcon className="w-4 h-4" />
            Nuevo periodo
          </Button>
        }
      />

      <div className="bg-white rounded-2xl shadow-sm p-6">
        <Table columns={columns} data={periodos} loading={loading} emptyMessage="No hay periodos registrados" />
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editPeriodo ? 'Editar periodo' : 'Nuevo periodo'}
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button type="submit" form="periodo-form" loading={saving}>
              {editPeriodo ? 'Guardar cambios' : 'Crear periodo'}
            </Button>
          </>
        }
      >
        <form id="periodo-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Nombre"
            error={errors.nombre?.message}
            {...register('nombre', { required: 'Obligatorio' })}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Fecha inicio"
              type="date"
              error={errors.fecha_inicio?.message}
              {...register('fecha_inicio', { required: 'Obligatorio' })}
            />
            <Input
              label="Fecha fin"
              type="date"
              error={errors.fecha_fin?.message}
              {...register('fecha_fin', { required: 'Obligatorio' })}
            />
          </div>
          <Input
            label="Horas máximas"
            type="number"
            error={errors.horas_max?.message}
            {...register('horas_max', { required: 'Obligatorio', min: 1 })}
          />
          <label className="flex items-center gap-3 cursor-pointer">
            <div className="relative">
              <input
                type="checkbox"
                className="sr-only"
                {...register('activo')}
              />
              <div
                className={`w-10 h-5 rounded-full transition-colors ${watchActivo ? 'bg-orange-500' : 'bg-gray-200'}`}
              >
                <div
                  className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${watchActivo ? 'translate-x-5' : ''}`}
                />
              </div>
            </div>
            <span className="text-sm font-medium text-gray-700">Periodo activo</span>
          </label>

          {warning && (
            <div className="flex items-start gap-2 bg-yellow-50 border border-yellow-200 rounded-xl p-3">
              <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
              <p className="text-yellow-700 text-sm">{warning}</p>
            </div>
          )}
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Eliminar periodo"
        message={`¿Estás seguro de que deseas eliminar "${deleteTarget?.nombre}"?`}
        confirmLabel="Eliminar"
        loading={deleting}
      />
    </div>
  );
}
