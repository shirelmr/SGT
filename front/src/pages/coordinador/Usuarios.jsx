import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { getUsuarios, createUsuario, updateUsuario, deleteUsuario } from '../../api/usuarios';
import { getPeriodos } from '../../api/periodos';
import PageHeader from '../../components/shared/PageHeader';
import Button from '../../components/ui/Button';
import Table from '../../components/ui/Table';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Badge from '../../components/ui/Badge';
import ConfirmDialog from '../../components/shared/ConfirmDialog';

const roleBadge = {
  coordinador: 'info',
  tutor: 'orange',
  revisor: 'warning',
  beneficiario: 'success',
};

const roleLabels = {
  coordinador: 'Coordinador',
  tutor: 'Tutor',
  revisor: 'Revisor',
  beneficiario: 'Beneficiario',
};

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [periodos, setPeriodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm();

  const watchedRol = watch('rol');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [u, p] = await Promise.allSettled([getUsuarios(), getPeriodos()]);
      if (u.status === 'fulfilled') setUsuarios(u.value.data);
      if (p.status === 'fulfilled') setPeriodos(p.value.data);
    } catch {
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setEditUser(null);
    reset({});
    setModalOpen(true);
  }

  function openEdit(user) {
    setEditUser(user);
    reset(user);
    setModalOpen(true);
  }

  function openDelete(user) {
    setDeleteTarget(user);
    setConfirmOpen(true);
  }

  async function onSubmit(data) {
    setSaving(true);
    try {
      if (editUser) {
        const { password, ...rest } = data;
        await updateUsuario(editUser.id, rest);
        toast.success('Usuario actualizado');
      } else {
        await createUsuario(data);
        toast.success('Usuario creado');
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
      await deleteUsuario(deleteTarget.id);
      toast.success('Usuario eliminado');
      setConfirmOpen(false);
      loadData();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Error al eliminar');
    } finally {
      setDeleting(false);
    }
  }

  const columns = [
    { key: 'nombre_completo', label: 'Nombre' },
    { key: 'email', label: 'Email' },
    {
      key: 'rol',
      label: 'Rol',
      render: (v) => <Badge variant={roleBadge[v] || 'default'}>{roleLabels[v] || v}</Badge>,
    },
    {
      key: 'activo',
      label: 'Estado',
      render: (v) => <Badge variant={v !== false ? 'success' : 'danger'}>{v !== false ? 'Activo' : 'Inactivo'}</Badge>,
    },
    {
      key: 'acciones',
      label: 'Acciones',
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => openEdit(row)}
            className="p-1.5 rounded-lg hover:bg-orange-50 text-orange-500 transition-colors"
          >
            <PencilIcon className="w-4 h-4" />
          </button>
          <button
            onClick={() => openDelete(row)}
            className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors"
          >
            <TrashIcon className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Usuarios"
        subtitle="Gestiona los usuarios del sistema"
        right={
          <Button onClick={openCreate}>
            <PlusIcon className="w-4 h-4" />
            Nuevo usuario
          </Button>
        }
      />

      <div className="bg-white rounded-2xl shadow-sm p-6">
        <Table columns={columns} data={usuarios} loading={loading} emptyMessage="No hay usuarios registrados" />
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editUser ? 'Editar usuario' : 'Nuevo usuario'}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button type="submit" form="user-form" loading={saving}>
              {editUser ? 'Guardar cambios' : 'Crear usuario'}
            </Button>
          </>
        }
      >
        <form id="user-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Nombre completo"
              error={errors.nombre_completo?.message}
              {...register('nombre_completo', { required: 'Obligatorio' })}
            />
            <Input
              label="Email"
              type="email"
              error={errors.email?.message}
              {...register('email', { required: 'Obligatorio' })}
            />
          </div>

          {!editUser && (
            <Input
              label="Contraseña"
              type="password"
              error={errors.password?.message}
              {...register('password', { required: 'Obligatorio' })}
            />
          )}

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Rol</label>
            <select
              className="border-2 border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
              {...register('rol', { required: 'Obligatorio' })}
            >
              <option value="">Seleccionar rol</option>
              <option value="coordinador">Coordinador</option>
              <option value="tutor">Tutor</option>
              <option value="revisor">Revisor</option>
              <option value="beneficiario">Beneficiario</option>
            </select>
            {errors.rol && <p className="text-xs text-red-500">{errors.rol.message}</p>}
          </div>

          {/* Conditional fields */}
          {watchedRol === 'tutor' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-gray-100">
              <Input label="Matrícula" {...register('matricula')} />
              <Input label="Carrera" {...register('carrera')} />
              <Input label="Semestre" type="number" {...register('semestre')} />
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Periodo</label>
                <select className="border-2 border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-orange-400" {...register('id_periodo')}>
                  <option value="">Sin periodo</option>
                  {periodos.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                </select>
              </div>
              <Input label="Link video" {...register('link_video')} className="sm:col-span-2" />
            </div>
          )}

          {watchedRol === 'beneficiario' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-gray-100">
              <Input label="Grado escolar" {...register('grado_escolar')} />
              <Input label="Escuela" {...register('escuela')} />
              <Input label="Nombre tutor legal" {...register('nombre_tutor_legal')} />
              <Input label="Tel. tutor" {...register('tel_tutor')} />
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Periodo</label>
                <select className="border-2 border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-orange-400" {...register('id_periodo')}>
                  <option value="">Sin periodo</option>
                  {periodos.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                </select>
              </div>
            </div>
          )}

          {watchedRol === 'revisor' && (
            <div className="pt-2 border-t border-gray-100">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Periodo</label>
                <select className="border-2 border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-orange-400" {...register('id_periodo')}>
                  <option value="">Sin periodo</option>
                  {periodos.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                </select>
              </div>
            </div>
          )}

          {watchedRol === 'coordinador' && (
            <div className="pt-2 border-t border-gray-100">
              <Input label="Departamento" {...register('departamento')} />
            </div>
          )}
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Eliminar usuario"
        message={`¿Estás seguro de que deseas eliminar a "${deleteTarget?.nombre_completo}"? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        loading={deleting}
      />
    </div>
  );
}
