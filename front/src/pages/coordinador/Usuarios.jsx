import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';
import {
  PlusIcon, PencilIcon, TrashIcon, MagnifyingGlassIcon,
  ArrowDownTrayIcon, EyeIcon, ChevronDownIcon, UserMinusIcon,
} from '@heroicons/react/24/outline';
import { getUsuarios, createUsuario, updateUsuario, deleteUsuario, getUsuarioResumen } from '../../api/usuarios';
import { getHoras } from '../../api/horas';
import { getPeriodos } from '../../api/periodos';
import PageHeader from '../../components/shared/PageHeader';
import Button from '../../components/ui/Button';
import Table from '../../components/ui/Table';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Badge from '../../components/ui/Badge';
import ConfirmDialog from '../../components/shared/ConfirmDialog';
import Spinner from '../../components/ui/Spinner';

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

function StatCard({ label, value, sub }) {
  return (
    <div className="bg-orange-50 rounded-xl p-3 text-center">
      <p className="text-2xl font-bold text-orange-600">{value}</p>
      <p className="text-xs text-gray-600 mt-0.5">{label}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

function Field({ label, value }) {
  return (
    <div>
      <p className="text-xs text-gray-400">{label}</p>
      <p className="text-sm font-medium text-gray-800">{value || '—'}</p>
    </div>
  );
}

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [periodos, setPeriodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroRol, setFiltroRol] = useState('');
  const [filtroPeriodo, setFiltroPeriodo] = useState('activo');
  const [busqueda, setBusqueda] = useState('');

  // create / edit modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [saving, setSaving] = useState(false);

  // delete dialog
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // dar de baja
  const [bajaOpen, setBajaOpen] = useState(false);
  const [bajaTarget, setBajaTarget] = useState(null);
  const [bajaLoading, setBajaLoading] = useState(false);

  // resumen modal
  const [resumenOpen, setResumenOpen] = useState(false);
  const [resumen, setResumen] = useState(null);
  const [loadingResumen, setLoadingResumen] = useState(false);

  // export dropdown
  const [exportOpen, setExportOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const exportRef = useRef(null);

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm();
  const watchedRol = watch('rol');

  useEffect(() => {
    function handleClick(e) {
      if (exportRef.current && !exportRef.current.contains(e.target)) setExportOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => { loadData(); }, [filtroRol, filtroPeriodo]);

  async function loadData() {
    setLoading(true);
    try {
      const params = {};
      if (filtroRol) params.rol = filtroRol;
      if (filtroPeriodo === 'todos') params.todos = true;
      else if (filtroPeriodo && filtroPeriodo !== 'activo') params.id_periodo = filtroPeriodo;

      const [u, p] = await Promise.allSettled([getUsuarios(params), getPeriodos()]);
      if (u.status === 'fulfilled') setUsuarios(u.value.data);
      if (p.status === 'fulfilled') setPeriodos(p.value.data);
    } catch {
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  }

  async function openResumen(user) {
    setResumen(null);
    setResumenOpen(true);
    setLoadingResumen(true);
    try {
      const params = {};
      if (filtroPeriodo && filtroPeriodo !== 'activo' && filtroPeriodo !== 'todos') {
        params.id_periodo = filtroPeriodo;
      }
      const r = await getUsuarioResumen(user.id, params);
      setResumen(r.data);
    } catch (err) {
      console.error('[resumen]', err?.response?.data || err);
      toast.error(err?.response?.data?.error || 'Error al cargar el resumen');
      setResumenOpen(false);
    } finally {
      setLoadingResumen(false);
    }
  }

  function openCreate() { setEditUser(null); reset({}); setModalOpen(true); }
  function openEdit(user) { setEditUser(user); reset(user); setModalOpen(true); }
  function openDelete(user) { setDeleteTarget(user); setConfirmOpen(true); }

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
      toast.error(err?.response?.data?.error || 'Error al guardar');
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
      toast.error(err?.response?.data?.error || 'Error al eliminar');
    } finally {
      setDeleting(false);
    }
  }

  async function handleBaja() {
    setBajaLoading(true);
    try {
      await updateUsuario(bajaTarget.id, { id_periodo: null, id_tutor: null });
      toast.success(`${bajaTarget.nombre_completo} fue dado de baja del periodo`);
      setBajaOpen(false);
      loadData();
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Error al dar de baja');
    } finally {
      setBajaLoading(false);
    }
  }

  // ── Excel exports ──────────────────────────────────────────────────────
  async function exportar(tipo) {
    setExporting(true);
    setExportOpen(false);
    try {
      const periodoLabel = periodos.find((p) => String(p.id) === String(filtroPeriodo))?.nombre || 'periodo';
      const wb = XLSX.utils.book_new();

      if (tipo === 'tutores') {
        const periodoParam = filtroPeriodo !== 'activo' && filtroPeriodo !== 'todos' ? filtroPeriodo : null;
        const horasRes = await getHoras(periodoParam ? { id_periodo: periodoParam } : {});
        const horasMap = {};
        (horasRes.data || []).forEach((h) => { horasMap[h.id_tutor] = h; });

        const tutores = usuarios.filter((u) => u.rol === 'tutor');
        const rows = tutores.map((u) => {
          const h = horasMap[u.id_tutor] || {};
          return {
            'Nombre': u.nombre_completo,
            'Email': u.email,
            'Matrícula': u.matricula || '',
            'Carrera': u.carrera || '',
            'Semestre': u.semestre || '',
            'Horas impartidas': Number(h.horas_impartidas ?? 0),
            'Horas extra': Number(h.horas_extra ?? 0),
            '% Acreditado': Number(h.porcentaje_acred ?? 0),
          };
        });
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), 'Tutores');
        XLSX.writeFile(wb, `tutores_${periodoLabel}.xlsx`);

      } else if (tipo === 'beneficiarios') {
        const benefs = usuarios.filter((u) => u.rol === 'beneficiario');
        const rows = benefs.map((u) => ({
          'Nombre': u.nombre_completo,
          'Email': u.email,
          'Escuela': u.escuela || '',
          'Grado escolar': u.grado_escolar || '',
          'Nombre tutor legal': u.nombre_tutor_legal || '',
          'Tel. tutor legal': u.tel_tutor || '',
        }));
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), 'Beneficiarios');
        XLSX.writeFile(wb, `beneficiarios_${periodoLabel}.xlsx`);

      } else if (tipo === 'completo') {
        // Sheet 1: all users
        const general = usuarios.map((u) => ({
          'Nombre': u.nombre_completo,
          'Email': u.email,
          'Rol': roleLabels[u.rol] || u.rol,
          'Matrícula': u.matricula || '',
          'Carrera': u.carrera || '',
          'Semestre': u.semestre || '',
          'Escuela': u.escuela || '',
          'Grado escolar': u.grado_escolar || '',
          'Departamento': u.departamento || '',
        }));
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(general), 'Todos');

        // Sheet 2: tutors with hours
        const periodoParam = filtroPeriodo !== 'activo' && filtroPeriodo !== 'todos' ? filtroPeriodo : null;
        const horasRes = await getHoras(periodoParam ? { id_periodo: periodoParam } : {});
        const horasMap = {};
        (horasRes.data || []).forEach((h) => { horasMap[h.id_tutor] = h; });
        const tutores = usuarios.filter((u) => u.rol === 'tutor').map((u) => {
          const h = horasMap[u.id_tutor] || {};
          return {
            'Nombre': u.nombre_completo,
            'Email': u.email,
            'Matrícula': u.matricula || '',
            'Carrera': u.carrera || '',
            'Horas impartidas': Number(h.horas_impartidas ?? 0),
            'Horas extra': Number(h.horas_extra ?? 0),
            '% Acreditado': Number(h.porcentaje_acred ?? 0),
          };
        });
        if (tutores.length) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(tutores), 'Tutores');

        // Sheet 3: beneficiaries
        const benefs = usuarios.filter((u) => u.rol === 'beneficiario').map((u) => ({
          'Nombre': u.nombre_completo,
          'Email': u.email,
          'Escuela': u.escuela || '',
          'Grado escolar': u.grado_escolar || '',
          'Nombre tutor legal': u.nombre_tutor_legal || '',
          'Tel. tutor legal': u.tel_tutor || '',
        }));
        if (benefs.length) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(benefs), 'Beneficiarios');

        XLSX.writeFile(wb, `resumen_completo_${periodoLabel}.xlsx`);
      }

      toast.success('Archivo exportado');
    } catch {
      toast.error('Error al exportar');
    } finally {
      setExporting(false);
    }
  }

  const filtered = usuarios.filter((u) =>
    u.nombre_completo.toLowerCase().includes(busqueda.toLowerCase())
  );

  const columns = [
    { key: 'nombre_completo', label: 'Nombre' },
    { key: 'email', label: 'Email' },
    {
      key: 'rol',
      label: 'Rol',
      render: (v) => <Badge variant={roleBadge[v] || 'default'}>{roleLabels[v] || v}</Badge>,
    },
    {
      key: 'acciones',
      label: 'Acciones',
      render: (_, row) => (
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => openResumen(row)}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
            title="Ver resumen"
          >
            <EyeIcon className="w-4 h-4" />
          </button>
          <button
            onClick={() => openEdit(row)}
            className="p-1.5 rounded-lg hover:bg-orange-50 text-orange-500 transition-colors"
            title="Editar"
          >
            <PencilIcon className="w-4 h-4" />
          </button>
          <button
            onClick={() => openDelete(row)}
            className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors"
            title="Eliminar"
          >
            <TrashIcon className="w-4 h-4" />
          </button>
          {row.rol === 'beneficiario' && (
            <button
              onClick={() => { setBajaTarget(row); setBajaOpen(true); }}
              className="p-1.5 rounded-lg hover:bg-yellow-50 text-yellow-600 transition-colors"
              title="Dar de baja"
            >
              <UserMinusIcon className="w-4 h-4" />
            </button>
          )}
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
          <div className="flex items-center gap-2">
            {/* Export dropdown */}
            <div className="relative" ref={exportRef}>
              <Button
                variant="secondary"
                onClick={() => setExportOpen((o) => !o)}
                loading={exporting}
              >
                <ArrowDownTrayIcon className="w-4 h-4" />
                Exportar
                <ChevronDownIcon className="w-3 h-3" />
              </Button>
              {exportOpen && (
                <div className="absolute right-0 mt-1 w-52 bg-white border border-gray-200 rounded-xl shadow-lg z-20 py-1">
                  {[
                    { key: 'tutores', label: 'Tutores + horas' },
                    { key: 'beneficiarios', label: 'Beneficiarios' },
                    { key: 'completo', label: 'Resumen completo (3 hojas)' },
                  ].map((opt) => (
                    <button
                      key={opt.key}
                      onClick={() => exportar(opt.key)}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-700 transition-colors"
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <Button onClick={openCreate}>
              <PlusIcon className="w-4 h-4" />
              Nuevo usuario
            </Button>
          </div>
        }
      />

      {/* Filters */}
      <div className="mb-4 flex items-center gap-3 flex-wrap">
        <div className="relative">
          <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar por nombre..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="pl-9 pr-3 py-1.5 text-sm border-2 border-gray-200 rounded-lg outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 w-56"
          />
        </div>

        <select
          value={filtroRol}
          onChange={(e) => setFiltroRol(e.target.value)}
          className="px-3 py-1.5 text-sm border-2 border-gray-200 rounded-lg outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
        >
          <option value="">Todos los roles</option>
          <option value="tutor">Tutor</option>
          <option value="beneficiario">Beneficiario</option>
          <option value="revisor">Revisor</option>
          <option value="coordinador">Coordinador</option>
        </select>

        <select
          value={filtroPeriodo}
          onChange={(e) => setFiltroPeriodo(e.target.value)}
          className="px-3 py-1.5 text-sm border-2 border-gray-200 rounded-lg outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
        >
          <option value="activo">Periodo activo</option>
          {periodos.map((p) => (
            <option key={p.id} value={String(p.id)}>{p.nombre}</option>
          ))}
          <option value="todos">Todos / inactivos</option>
        </select>
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-6">
        <Table
          columns={columns}
          data={filtered}
          loading={loading}
          emptyMessage="No hay usuarios registrados"
        />
      </div>

      {/* ── User summary modal ── */}
      <Modal
        isOpen={resumenOpen}
        onClose={() => setResumenOpen(false)}
        title="Resumen del usuario"
        size="lg"
      >
        {loadingResumen ? (
          <div className="flex justify-center py-10"><Spinner size="lg" /></div>
        ) : resumen ? (
          <div className="space-y-5">
            {/* Header */}
            <div className="flex items-center gap-4">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-xl font-bold flex-shrink-0"
                style={{ backgroundColor: '#ee7e4c' }}
              >
                {resumen.nombre_completo.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="font-sora text-lg font-bold text-gray-900">{resumen.nombre_completo}</h2>
                <p className="text-sm text-gray-500">{resumen.email}</p>
                <Badge variant={roleBadge[resumen.rol] || 'default'} className="mt-1">
                  {roleLabels[resumen.rol] || resumen.rol}
                </Badge>
              </div>
            </div>

            {/* Profile data */}
            <div className="border-t border-gray-100 pt-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Datos del perfil</p>
              <div className="grid grid-cols-2 gap-3">
                {resumen.rol === 'tutor' && (
                  <>
                    <Field label="Matrícula" value={resumen.perfil?.matricula} />
                    <Field label="Carrera" value={resumen.perfil?.carrera} />
                    <Field label="Semestre" value={resumen.perfil?.semestre} />
                    <Field label="Link video" value={resumen.perfil?.link_video} />
                  </>
                )}
                {resumen.rol === 'beneficiario' && (
                  <>
                    <Field label="Escuela" value={resumen.perfil?.escuela} />
                    <Field label="Grado escolar" value={resumen.perfil?.grado_escolar} />
                    <Field label="Nombre tutor legal" value={resumen.perfil?.nombre_tutor_legal} />
                    <Field label="Tel. tutor legal" value={resumen.perfil?.tel_tutor} />
                    <div className="col-span-2">
                      <Field label="Tutor asignado" value={resumen.tutor_asignado} />
                    </div>
                  </>
                )}
                {resumen.rol === 'revisor' && (
                  <>
                    <Field label="Matrícula" value={resumen.perfil?.matricula} />
                    <Field label="Carrera" value={resumen.perfil?.carrera} />
                    <Field label="Semestre" value={resumen.perfil?.semestre} />
                  </>
                )}
                {resumen.rol === 'coordinador' && (
                  <Field label="Departamento" value={resumen.perfil?.departamento} />
                )}
              </div>
            </div>

            {/* Stats */}
            {Object.keys(resumen.stats).length > 0 && (
              <div className="border-t border-gray-100 pt-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Estadísticas del periodo</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {resumen.rol === 'tutor' && (
                    <>
                      <StatCard label="Sesiones realizadas" value={resumen.stats.sesiones_realizadas} sub={`de ${resumen.stats.sesiones_total} totales`} />
                      <StatCard label="Horas impartidas" value={resumen.stats.horas_impartidas} sub={resumen.stats.horas_extra > 0 ? `+${resumen.stats.horas_extra} extra` : undefined} />
                      <StatCard label="Bitácoras aprobadas" value={resumen.stats.bitacoras_aprobadas} sub={`de ${resumen.stats.bitacoras_total} totales`} />
                      <StatCard label="% Acreditado" value={`${resumen.stats.porcentaje_acred.toFixed(1)}%`} />
                    </>
                  )}
                  {resumen.rol === 'beneficiario' && (
                    <>
                      <StatCard label="Sesiones realizadas" value={resumen.stats.sesiones_realizadas} sub={`de ${resumen.stats.sesiones_total} totales`} />
                      <StatCard label="Sesiones programadas" value={resumen.stats.sesiones_programadas} />
                    </>
                  )}
                  {resumen.rol === 'revisor' && (
                    <>
                      <StatCard label="Bitácoras revisadas" value={resumen.stats.bitacoras_revisadas} />
                      <StatCard label="Aprobadas" value={resumen.stats.bitacoras_aprobadas} />
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : null}
      </Modal>

      {/* ── Create / Edit modal ── */}
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-gray-100">
              <Input label="Matrícula" {...register('matricula')} />
              <Input label="Carrera" {...register('carrera')} />
              <Input label="Semestre" type="number" {...register('semestre')} />
              <div className="flex flex-col gap-1 sm:col-span-2">
                <label className="text-sm font-medium text-gray-700">Periodo</label>
                <select 
                  className="border-2 border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-orange-400" 
                  {...register('id_periodo')}
                >
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

      <ConfirmDialog
        isOpen={bajaOpen}
        onClose={() => setBajaOpen(false)}
        onConfirm={handleBaja}
        title="Dar de baja"
        message={`¿Estás seguro de que deseas dar de baja a "${bajaTarget?.nombre_completo}"? Se eliminará su asignación al periodo y tutor actual.`}
        confirmLabel="Dar de baja"
        loading={bajaLoading}
      />
    </div>
  );
}
