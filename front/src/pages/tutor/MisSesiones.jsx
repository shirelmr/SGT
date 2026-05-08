import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { PlusIcon, ChatBubbleLeftIcon, ExclamationCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';
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
  revisado: 'orange',
  aprobado: 'success',
};

const estadoBitacoraLabel = {
  pendiente: 'Pendiente de revisión',
  revisado: 'En revisión',
  aprobado: 'Aprobada',
};

const tipoLabel = {
  retardo: 'Retardo',
  no_se_presento: 'No se presentó',
  inasistencia: 'Inasistencia',
  otro: 'Otro',
};

export default function MisSesionesTutor() {
  const [sesiones, setSesiones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // { sesionId, tema }
  const [incidencias, setIncidencias] = useState([]);
  const [loadingInc, setLoadingInc] = useState(false);
  const [savingInc, setSavingInc] = useState(false);
  const [form, setForm] = useState({ tipo: 'retardo', descripcion: '' });
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

  const sorted = [...sesiones].sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

  if (loading) {
    return <div className="flex items-center justify-center py-16"><Spinner size="lg" /></div>;
  }

  return (
    <div>
      <PageHeader
        title="Mis Sesiones"
        subtitle="Administra tus sesiones de tutoría"
        right={
          <Button onClick={() => navigate('/tutor/sesiones/nueva')}>
            <PlusIcon className="w-4 h-4" />
            Nueva sesión
          </Button>
        }
      />

      {sorted.length === 0 ? (
        <EmptyState
          icon="📅"
          title="Sin sesiones"
          description="Aún no tienes sesiones registradas. Crea tu primera sesión."
          action={() => navigate('/tutor/sesiones/nueva')}
          actionLabel="Nueva sesión"
        />
      ) : (
        <div className="space-y-3">
          {sorted.map((s) => {
            const hasUnread = s.bitacora_tiene_comentarios_nuevos;
            return (
              <div key={s.id} className="bg-white rounded-2xl shadow-sm p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-sora font-semibold text-gray-800 text-sm">{s.tema}</h3>
                    <Badge variant={estadoBadge[s.estado] || 'default'}>{s.estado}</Badge>
                    {hasUnread && (
                      <span className="inline-flex items-center gap-1 bg-red-100 text-red-600 rounded-full px-2 py-0.5 text-xs font-medium">
                        <ChatBubbleLeftIcon className="w-3 h-3" />
                        Nuevo comentario
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(s.fecha).toLocaleDateString('es-MX', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                    {' • '}{s.hora_inicio}
                    {s.beneficiario && ` • ${s.beneficiario.nombre_completo || ''}`}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {s.bitacora && (
                    <Badge variant={estadoBitacoraBadge[s.bitacora.estado] || 'default'}>
                      {estadoBitacoraLabel[s.bitacora.estado] || s.bitacora.estado}
                    </Badge>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => openModal(s)}>
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
            );
          })}
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
                    <option value="no_se_presento">No se presentó</option>
                    <option value="inasistencia">Inasistencia</option>
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
