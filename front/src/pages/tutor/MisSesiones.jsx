import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { PlusIcon, ChatBubbleLeftIcon, ExclamationCircleIcon, XMarkIcon, MagnifyingGlassIcon, FunnelIcon, CalendarDaysIcon, ChevronDownIcon, ChevronUpIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { getSesiones } from '../../api/sesiones';
import { getIncidenciasSesion, createIncidencia } from '../../api/incidencias';
import PageHeader from '../../components/shared/PageHeader';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';

const estadoBadge = {
  programada: 'info',
  realizada: 'success',
  cancelada: 'danger',
};

const estadoBitacoraBadge = {
  pendiente: 'warning',
  no_aprobada: 'danger',
  aprobado: 'success',
  aprobado_sin_horas: 'orange',
};

const estadoBitacoraLabel = {
  pendiente: 'Pendiente de revisión',
  no_aprobada: 'No aprobada',
  aprobado: 'Aprobada',
  aprobado_sin_horas: 'Aprobada sin horas',
};

// ─── Opciones de filtro ────────────────────────────────────────────────────
const FILTROS_SESION = [
  { value: 'todas', label: 'Todas' },
  { value: 'programada', label: 'Programada' },
  { value: 'realizada', label: 'Realizada' },
  { value: 'cancelada', label: 'Cancelada' },
];

const FILTROS_BITACORA = [
  { value: 'todas', label: 'Todas' },
  { value: 'sin_bitacora', label: 'Sin registrar' },
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'no_aprobada', label: 'No aprobada' },
  { value: 'aprobado', label: 'Aprobada' },
  { value: 'aprobado_sin_horas', label: 'Sin horas' },
];

// ─── Pill de filtro ────────────────────────────────────────────────────────
const colorPill = {
  // sesion
  programada: 'bg-blue-100 text-blue-700 border-blue-300',
  realizada:  'bg-green-100 text-green-700 border-green-300',
  cancelada:  'bg-red-100 text-red-700 border-red-300',
  // bitacora
  sin_bitacora:      'bg-gray-100 text-gray-600 border-gray-300',
  pendiente:         'bg-yellow-100 text-yellow-700 border-yellow-300',
  no_aprobada:       'bg-red-100 text-red-700 border-red-300',
  aprobado:          'bg-green-100 text-green-700 border-green-300',
  aprobado_sin_horas:'bg-orange-100 text-orange-700 border-orange-300',
};

function FilterPill({ value, label, active, onClick }) {
  const color = active
    ? colorPill[value] ?? 'bg-orange-500 text-white border-orange-500'
    : 'bg-white text-gray-500 border-gray-200 hover:border-orange-300 hover:text-orange-600';
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 rounded-full text-xs font-medium border transition-all whitespace-nowrap ${color} ${active ? 'shadow-sm' : ''}`}
    >
      {label}
    </button>
  );
}

const tipoLabel = {
  retardo: 'Retardo',
  inasistencia: 'Inasistencia (Aviso previo)',
  falta_injustificada: 'Falta Injustificada',
  otro: 'Otro',
};

const formatearFechaLocal = (fechaStr, opciones = {}) => {
  if (!fechaStr) return '';
  /// Extraemos solo el componente YYYY-MM-DD ignorando la zona horaria
  const [year, month, day] = fechaStr.split('T')[0].split('-').map(Number);
  // Creamos la fecha en hora local (los meses en JS van de 0 a 11, por eso el -1)
  return new Date(year, month - 1, day).toLocaleDateString('es-MX', opciones);
};

// ─── Card reutilizable de sesión (expandible) ─────────────────────────────
function SesionCard({ s, openModal }) {
  const [open, setOpen] = useState(false);
  const hasUnread = s.bitacora_tiene_comentarios_nuevos;

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden transition-shadow hover:shadow-md">
      {/* ── Fila principal (siempre visible) ── */}
      <div className="flex items-center gap-3 p-4">

        {/* Área expandible (tema + badges + fecha) */}
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex-1 min-w-0 text-left"
        >
          <h3 className="font-sora font-semibold text-gray-800 text-sm">{s.tema}</h3>
          <p className="text-xs text-gray-400 mt-0.5">
            {formatearFechaLocal(s.fecha, { day: 'numeric', month: 'short' })}
            {s.beneficiario && ` · ${s.beneficiario.nombre_completo}`}
          </p>
          <div className="flex items-center gap-2 flex-wrap mt-1.5">
            <span className="text-xs text-gray-400">Sesión:</span>
            <Badge variant={estadoBadge[s.estado] || 'default'}>{s.estado}</Badge>
            {s.bitacora && (
              <>
                <span className="text-gray-200">|</span>
                <span className="text-xs text-gray-400">Bitácora:</span>
                <Badge variant={estadoBitacoraBadge[s.bitacora.estado] || 'default'}>
                  {estadoBitacoraLabel[s.bitacora.estado] || s.bitacora.estado}
                </Badge>
              </>
            )}
            {hasUnread && (
              <span className="inline-flex items-center gap-1 bg-red-100 text-red-600 rounded-full px-2 py-0.5 text-xs font-medium">
                <ChatBubbleLeftIcon className="w-3 h-3" />
                Nuevo comentario
              </span>
            )}
          </div>
        </button>

        {/* Zona derecha: CTA rápido + checkmark + chevron */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {!s.bitacora && !open && (
            <Link to={`/tutor/sesiones/${s.id}/bitacora`} onClick={(e) => e.stopPropagation()}>
              <Button size="sm" variant="primary">Registrar bitácora</Button>
            </Link>
          )}
          {s.bitacora?.estado === 'aprobado' && (
            <CheckCircleIcon className="w-5 h-5 text-green-500" />
          )}
          <button onClick={() => setOpen((v) => !v)} className="text-gray-400 p-1">
            {open ? <ChevronUpIcon className="w-4 h-4" /> : <ChevronDownIcon className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* ── Panel expandido ── */}
      {open && (
        <div className="border-t border-gray-100 px-4 pb-4 pt-3 space-y-4">
          {/* Detalles de la sesión */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-400 mb-0.5">Fecha</p>
              <p className="text-sm font-medium text-gray-800">
                {formatearFechaLocal(s.fecha, { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-400 mb-0.5">Día</p>
              <p className="text-sm font-medium text-gray-800 capitalize">
                {formatearFechaLocal(s.fecha, { weekday: 'long' })}
              </p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-400 mb-0.5">Hora</p>
              <p className="text-sm font-medium text-gray-800">{s.hora_inicio || '—'}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-400 mb-0.5">Duración</p>
              <p className="text-sm font-medium text-gray-800">
                {s.duracion_hrs ? `${s.duracion_hrs} hr(s)` : '—'}
              </p>
            </div>
          </div>

          {s.beneficiario && (
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-400 mb-0.5">Beneficiario</p>
              <p className="text-sm font-medium text-gray-800">{s.beneficiario.nombre_completo}</p>
            </div>
          )}

          {/* Acciones */}
          <div className="flex items-center gap-2 flex-wrap pt-1">
            <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); openModal(s); }}>
              <ExclamationCircleIcon className="w-4 h-4" />
              Incidencia
            </Button>
            <Link to={`/tutor/sesiones/${s.id}/bitacora`}>
              <Button size="sm" variant={s.bitacora ? 'secondary' : 'primary'}>
                {s.bitacora ? 'Ver bitácora' : 'Registrar bitácora'}
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MisSesionesTutor() {
  const [sesiones, setSesiones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // { sesionId, tema }
  const [incidencias, setIncidencias] = useState([]);
  const [loadingInc, setLoadingInc] = useState(false);
  const [savingInc, setSavingInc] = useState(false);
  const [form, setForm] = useState({ tipo: 'retardo', descripcion: '' });

  // ── Filtros ──────────────────────────────────────────────────────────────
  const [busqueda, setBusqueda] = useState('');
  const [filtroSesion, setFiltroSesion] = useState('todas');
  const [filtroBitacora, setFiltroBitacora] = useState('todas');
  const [mostrarTodos, setMostrarTodos] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    getSesiones()
      .then((r) => setSesiones(r.data || []))
      .catch(() => toast.error('Error al cargar sesiones'))
      .finally(() => setLoading(false));
  }, []);

  function openModal(sesion) {
    setModal({ sesionId: sesion.id, tema: sesion.tema });
    setForm({ tipo: 'retardo', descripcion: '' });
    setLoadingInc(true);
    getIncidenciasSesion(sesion.id)
      .then((r) => setIncidencias(r.data || []))
      .catch(() => toast.error('Error al cargar incidencias'))
      .finally(() => setLoadingInc(false));
  }

  function closeModal() {
    setModal(null);
    setIncidencias([]);
  }

  async function handleSubmitIncidencia(e) {
    e.preventDefault();
    setSavingInc(true);
    try {
      const res = await createIncidencia({ id_sesion: modal.sesionId, ...form });
      setIncidencias((prev) => [res.data, ...prev]);
      setForm({ tipo: 'retardo', descripcion: '' });
      toast.success('Incidencia registrada');
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Error al registrar incidencia');
    } finally {
      setSavingInc(false);
    }
  }

  // ── Lógica de filtrado (client-side) ────────────────────────────────────
  const filtered = useMemo(() => {
    let result = [...sesiones].sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

    // 0. Período: solo activo por defecto
    if (!mostrarTodos) {
      result = result.filter((s) => s.periodo?.activo === true);
    }

    // 1. Búsqueda por texto
    if (busqueda.trim()) {
      const q = busqueda.trim().toLowerCase();
      result = result.filter((s) => {
        const tema = (s.tema || '').toLowerCase();
        const beneficiario = (s.beneficiario?.nombre_completo || '').toLowerCase();
        return tema.includes(q) || beneficiario.includes(q);
      });
    }

    // 2. Estado de la sesión
    if (filtroSesion !== 'todas') {
      result = result.filter((s) => s.estado === filtroSesion);
    }

    // 3. Estado de la bitácora
    if (filtroBitacora !== 'todas') {
      if (filtroBitacora === 'sin_bitacora') {
        result = result.filter((s) => !s.bitacora);
      } else {
        result = result.filter((s) => s.bitacora?.estado === filtroBitacora);
      }
    }

    return result;
  }, [sesiones, busqueda, filtroSesion, filtroBitacora, mostrarTodos]);

  // ── Agrupación por período (solo en vista "todos") ───────────────────────
  const grupos = useMemo(() => {
    if (!mostrarTodos) return null;
    const map = {};
    filtered.forEach((s) => {
      const key = s.id_periodo ?? 0;
      if (!map[key]) {
        map[key] = {
          id: key,
          nombre: s.periodo?.nombre ?? `Período ${key}`,
          activo: s.periodo?.activo ?? false,
          sesiones: [],
        };
      }
      map[key].sesiones.push(s);
    });
    // Período activo primero, luego descendente por id
    return Object.values(map).sort((a, b) => {
      if (a.activo !== b.activo) return b.activo - a.activo;
      return b.id - a.id;
    });
  }, [filtered, mostrarTodos]);

  const hayFiltrosActivos =
    busqueda.trim() !== '' || filtroSesion !== 'todas' || filtroBitacora !== 'todas';

  function limpiarFiltros() {
    setBusqueda('');
    setFiltroSesion('todas');
    setFiltroBitacora('todas');
  }

  // Cuenta de sesiones históricas (períodos inactivos) para mostrar en el botón
  const sesionesHistoricas = useMemo(
    () => sesiones.filter((s) => s.periodo?.activo === false).length,
    [sesiones]
  );

  if (loading) {
    return <div className="flex items-center justify-center py-16"><Spinner size="lg" /></div>;
  }

  return (
    <div>
      <PageHeader
        title="Mis Sesiones"
        subtitle={mostrarTodos ? 'Todos los períodos' : 'Período activo'}
        right={
          <div className="flex items-center gap-2">
            {sesionesHistoricas > 0 && (
              <button
                onClick={() => setMostrarTodos((v) => !v)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                  mostrarTodos
                    ? 'bg-orange-500 text-white border-orange-500 shadow-sm'
                    : 'bg-white text-gray-500 border-gray-200 hover:border-orange-300 hover:text-orange-600'
                }`}
              >
                <CalendarDaysIcon className="w-3.5 h-3.5" />
                {mostrarTodos ? 'Solo período activo' : `Ver historial (${sesionesHistoricas})`}
              </button>
            )}
            <Button onClick={() => navigate('/tutor/sesiones/nueva')}>
              <PlusIcon className="w-4 h-4" />
              Nueva sesión
            </Button>
          </div>
        }
      />

      {/* ── Panel de filtros ─────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl shadow-sm p-4 mb-4 space-y-3">
        {/* Buscador */}
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por tema o beneficiario…"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border-2 border-gray-200 rounded-xl outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition"
          />
          {busqueda && (
            <button
              onClick={() => setBusqueda('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filtro estado de sesión */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide flex items-center gap-1">
            <FunnelIcon className="w-3 h-3" /> Sesión
          </span>
          {FILTROS_SESION.map((f) => (
            <FilterPill
              key={f.value}
              value={f.value}
              label={f.label}
              active={filtroSesion === f.value}
              onClick={() => setFiltroSesion(f.value)}
            />
          ))}
        </div>

        {/* Filtro estado de bitácora */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide flex items-center gap-1">
            <FunnelIcon className="w-3 h-3" /> Bitácora
          </span>
          {FILTROS_BITACORA.map((f) => (
            <FilterPill
              key={f.value}
              value={f.value}
              label={f.label}
              active={filtroBitacora === f.value}
              onClick={() => setFiltroBitacora(f.value)}
            />
          ))}
        </div>

        {/* Resumen y limpiar */}
        {hayFiltrosActivos && (
          <div className="flex items-center justify-between pt-1 border-t border-gray-100">
            <span className="text-xs text-gray-500">
              {filtered.length} {filtered.length === 1 ? 'sesión encontrada' : 'sesiones encontradas'} de {sesiones.length}
            </span>
            <button
              onClick={limpiarFiltros}
              className="text-xs text-orange-500 hover:text-orange-700 font-medium transition-colors"
            >
              Limpiar filtros
            </button>
          </div>
        )}
      </div>

      {filtered.length === 0 && sesiones.length === 0 ? (
        <EmptyState
          icon="📅"
          title="Sin sesiones"
          description="Aún no tienes sesiones registradas. Crea tu primera sesión."
          action={() => navigate('/tutor/sesiones/nueva')}
          actionLabel="Nueva sesión"
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="🔍"
          title="Sin resultados"
          description="Ninguna sesión coincide con los filtros seleccionados."
          action={limpiarFiltros}
          actionLabel="Limpiar filtros"
        />
      ) : mostrarTodos ? (
        /* ── Vista agrupada por período ─────────────────────────────────── */
        <div className="space-y-6">
          {grupos.map((grupo) => (
            <div key={grupo.id}>
              {/* Encabezado de período */}
              <div className="flex items-center gap-3 mb-3">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${
                  grupo.activo
                    ? 'bg-orange-100 text-orange-700 border border-orange-200'
                    : 'bg-gray-100 text-gray-500 border border-gray-200'
                }`}>
                  <CalendarDaysIcon className="w-3.5 h-3.5" />
                  {grupo.nombre}
                  {grupo.activo && <span className="ml-1 text-orange-500">● activo</span>}
                </span>
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-xs text-gray-400">{grupo.sesiones.length} {grupo.sesiones.length === 1 ? 'sesión' : 'sesiones'}</span>
              </div>
              {/* Cards del período */}
              <div className="space-y-3">
                {grupo.sesiones.map((s) => <SesionCard key={s.id} s={s} openModal={openModal} />)}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* ── Vista normal (solo período activo) ─────────────────────────── */
        <div className="space-y-3">
          {filtered.map((s) => <SesionCard key={s.id} s={s} openModal={openModal} />)}
        </div>
      )}

      {/* Modal de incidencias */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <div>
                <h2 className="font-sora font-semibold text-gray-800 text-sm">Incidencias</h2>
                <p className="text-xs text-gray-500 mt-0.5 truncate">{modal.tema}</p>
              </div>
              <button onClick={closeModal} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400">
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 p-4 space-y-4">
              {/* Formulario nueva incidencia */}
              <form onSubmit={handleSubmitIncidencia} className="space-y-3 pb-4 border-b border-gray-100">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Registrar nueva incidencia</p>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-gray-700">Tipo</label>
                  <select
                    className="border-2 border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                    value={form.tipo}
                    onChange={(e) => setForm((f) => ({ ...f, tipo: e.target.value }))}
                  >
                    <option value="retardo">Retardo</option>
                    <option value="inasistencia">Inasistencia (Aviso previo)</option>
                    <option value="falta_injustificada">Falta Injustificada</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-gray-700">Descripción <span className="text-gray-400 font-normal">(opcional)</span></label>
                  <textarea
                    className="border-2 border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 resize-none"
                    rows={3}
                    placeholder="Detalles adicionales..."
                    value={form.descripcion}
                    onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))}
                  />
                </div>
                <Button type="submit" size="sm" loading={savingInc}>
                  Registrar incidencia
                </Button>
              </form>

              {/* Lista de incidencias existentes */}
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Incidencias registradas</p>
                {loadingInc ? (
                  <div className="flex justify-center py-4"><Spinner /></div>
                ) : incidencias.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">Sin incidencias registradas</p>
                ) : (
                  <div className="space-y-2">
                    {incidencias.map((inc) => (
                      <div key={inc.id_incidencia} className="bg-gray-50 rounded-xl p-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-semibold text-orange-600 bg-orange-50 rounded-full px-2 py-0.5">
                            {tipoLabel[inc.tipo] || inc.tipo}
                          </span>
                          <span className="text-xs text-gray-400">
                            {new Date(inc.fecha_registro).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        </div>
                        {inc.descripcion && (
                          <p className="text-sm text-gray-600 mt-1">{inc.descripcion}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
