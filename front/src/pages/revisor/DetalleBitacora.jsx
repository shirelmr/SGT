import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { ArrowLeftIcon, PaperClipIcon, ExclamationCircleIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { getBitacora, updateBitacora, createRevisionSinBitacora } from '../../api/bitacoras';
import { getComentarios, createComentario } from '../../api/comentarios';
import { getIncidenciasSesion } from '../../api/incidencias';
import { getSesion } from '../../api/sesiones';
import PageHeader from '../../components/shared/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Spinner from '../../components/ui/Spinner';

const estadoBadge = {
  pendiente: 'warning',
  aprobado: 'success',
  no_aprobada: 'danger',
  aprobado_sin_horas: 'orange',
};

const estadoLabel = {
  pendiente: 'Pendiente',
  aprobado: 'Aprobado',
  no_aprobada: 'No aprobada',
  aprobado_sin_horas: 'Aprobado sin horas',
};

function getFileUrl(p) {
  if (!p) return null;
  if (p.startsWith('http')) return p;
  const base = import.meta.env.VITE_API_URL?.replace('/api', '') || '';
  return `${base}${p}`;
}

export default function DetalleBitacora() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [bitacora, setBitacora] = useState(null);
  const [sesionData, setSesionData] = useState(null);
  const [comentarios, setComentarios] = useState([]);
  const [incidencias, setIncidencias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sendingComment, setSendingComment] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm();
  const [modalOpen, setModalOpen] = useState(false);
  const [pendingStatus, setPendingStatus] = useState(null);
  const [motivo, setMotivo] = useState('');
  const [motivoError, setMotivoError] = useState(false);


  useEffect(() => {
    async function load() {
      try {
        let bitacoraData = null;
        try {
          const bRes = await getBitacora(id);
          bitacoraData = bRes.data;
        } catch (err) {
          if (err?.response?.status !== 404) throw err;
        }

        setBitacora(bitacoraData);

        const idSesion = bitacoraData?.sesion?.id_sesion ?? Number(id);

        const [sRes, cRes, iRes] = await Promise.allSettled([
          bitacoraData ? Promise.resolve(null) : getSesion(id),
          bitacoraData ? getComentarios(bitacoraData.id) : Promise.resolve({ data: [] }),
          getIncidenciasSesion(idSesion),
        ]);

        if (!bitacoraData && sRes.status === 'fulfilled' && sRes.value) {
          setSesionData(sRes.value.data);
        }
        setComentarios(cRes.status === 'fulfilled' ? cRes.value?.data || [] : []);
        setIncidencias(iRes.status === 'fulfilled' ? iRes.value.data || [] : []);
      } catch {
        toast.error('Error al cargar la información de la sesión');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);


  async function onCommentSubmit(data) {
    setSendingComment(true);
    try {
      await createComentario({ texto: data.texto, id_bitacora: bitacora.id });
      toast.success('Comentario enviado');
      reset();
      const cRes = await getComentarios(bitacora.id);
      setComentarios(cRes.data || []);
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Error al enviar comentario');
    } finally {
      setSendingComment(false);
    }
  }

  function handleStatusChange(nuevoEstado) {
    if (['no_aprobada', 'aprobado_sin_horas'].includes(nuevoEstado)) {
      setPendingStatus(nuevoEstado);
      setMotivo('');
      setMotivoError(false);
      setModalOpen(true);
      return;
    }
    executeStatusChange(nuevoEstado, '');
  }

  async function executeStatusChange(nuevoEstado, comentarioText) {
    setUpdatingStatus(true);
    try {
      let bitacoraId;
      
      if (bitacora) {
        await updateBitacora(bitacora.id, { estado: nuevoEstado });
        setBitacora({ ...bitacora, estado: nuevoEstado });
        bitacoraId = bitacora.id;
      } else {
        const res = await createRevisionSinBitacora({ id_sesion: Number(id), estado: nuevoEstado });
        setBitacora(res.data);
        bitacoraId = res.data.id;
      }

      if (comentarioText) {
        await createComentario({ texto: comentarioText, id_bitacora: bitacoraId });
        const cRes = await getComentarios(bitacoraId);
        setComentarios(cRes.data || []);
      }

      if (nuevoEstado === 'aprobado') toast.success('Bitácora aprobada y horas acreditadas');
      else if (nuevoEstado === 'aprobado_sin_horas') toast.success('Sesión aprobada sin horas. Comentario guardado.');
      else toast.success(`Estado actualizado y motivo enviado al tutor.`);
      
      setModalOpen(false);
    } catch (err) {
      console.error('Error del backend:', err);
      toast.error('Error al actualizar el estado o guardar el comentario');
    } finally {
      setUpdatingStatus(false);
      setPendingStatus(null);
    }
  }

  // 3. Valida el modal antes de enviar
  const handleModalSubmit = () => {
    if (!motivo || motivo.trim() === '') {
      setMotivoError(true);
      return;
    }
    executeStatusChange(pendingStatus, motivo);
  };

  if (loading) {
    return <div className="flex items-center justify-center py-16"><Spinner size="lg" /></div>;
  }

  if (!bitacora && !sesionData) {
    return (
      <div>
        <PageHeader title="Sesión no encontrada" />
        <Button variant="secondary" onClick={() => navigate(-1)}>
          <ArrowLeftIcon className="w-4 h-4" /> Volver
        </Button>
      </div>
    );
  }

  const sesion = bitacora?.sesion || sesionData || {};
  const currentEstado = bitacora?.estado || 'pendiente';

  const tipoLabel = {
    retardo: 'Retardo',
    no_se_presento: 'No se presentó',
    inasistencia: 'Inasistencia',
    otro: 'Otro',
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-xl hover:bg-gray-100 text-gray-600 transition-colors"
        >
          <ArrowLeftIcon className="w-5 h-5" />
        </button>
        <div>
          <h1 className="font-sora text-2xl font-bold text-gray-900">
            {bitacora ? 'Detalle Bitácora' : 'Sesión con Incidencia'}
          </h1>
          <p className="text-gray-500 text-sm">{sesion.tema} • {sesion.fecha ? new Date(sesion.fecha).toLocaleDateString('es-MX') : ''}</p>
          {!bitacora && <span className="inline-block mt-1 text-xs font-medium text-yellow-700 bg-yellow-100 rounded-full px-2 py-0.5">Sin bitácora registrada</span>}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <Card title="Información de la sesión">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-gray-500 text-xs">Tutor</p>
                <p className="font-medium">{sesion.tutor?.nombre_completo || '—'}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs">Beneficiario</p>
                <p className="font-medium">{sesion.beneficiario?.nombre_completo || '—'}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs">Fecha</p>
                <p className="font-medium">{sesion.fecha ? new Date(sesion.fecha).toLocaleDateString('es-MX') : '—'}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs">Hora</p>
                <p className="font-medium">{sesion.hora_inicio || '—'}</p>
              </div>
            </div>
          </Card>

          {bitacora ? (
            <Card title="Contenido de la bitácora">
              <div className="space-y-4 text-sm">
                {[
                  { label: 'Actividades realizadas', field: 'actividades' },
                  { label: 'Logros', field: 'logros' },
                  { label: 'Dificultades', field: 'dificultades' },
                  { label: 'Plan para siguiente sesión', field: 'plan_siguiente' },
                ].map(({ label, field }) => (
                  <div key={field}>
                    <p className="text-xs text-gray-500 mb-1">{label}</p>
                    <p className="text-gray-800 whitespace-pre-wrap">{bitacora[field] || '—'}</p>
                  </div>
                ))}
                {bitacora.evidencia && (
                  <div>
                    <p className="text-xs text-gray-500 mb-2">Evidencia</p>
                    {/\.(jpg|jpeg|png|webp)$/i.test(bitacora.evidencia) ? (
                      <a href={getFileUrl(bitacora.evidencia)} target="_blank" rel="noopener noreferrer">
                        <img src={getFileUrl(bitacora.evidencia)} alt="Evidencia" className="max-h-48 rounded-xl object-cover border border-gray-100" />
                      </a>
                    ) : (
                      <a href={getFileUrl(bitacora.evidencia)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-orange-500 hover:underline text-sm">
                        <PaperClipIcon className="w-4 h-4" />
                        {/\.pdf$/i.test(bitacora.evidencia) ? 'Ver PDF' : 'Ver archivo'}
                      </a>
                    )}
                  </div>
                )}
              </div>
            </Card>
          ) : (
            <Card title="Bitácora">
              <p className="text-sm text-gray-400">El tutor no registró bitácora para esta sesión.</p>
            </Card>
          )}

          <Card title={`Incidencias (${incidencias.length})`}>
            {incidencias.length === 0 ? (
              <p className="text-gray-400 text-sm">Sin incidencias registradas.</p>
            ) : (
              <ul className="space-y-3">
                {incidencias.map((inc) => (
                  <li key={inc.id_incidencia} className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                    <div className="flex items-center justify-between mb-1">
                      <Badge variant="warning">{tipoLabel[inc.tipo] ?? inc.tipo}</Badge>
                      <span className="text-xs text-gray-400">
                        {new Date(inc.fecha_registro).toLocaleDateString('es-MX')}
                      </span>
                    </div>
                    {inc.descripcion && (
                      <p className="text-sm text-gray-600 mt-1">{inc.descripcion}</p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        {/* Right: Actions y Comments */}
        <div className="space-y-4">
          
          <Card title="Estado de la Revisión">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <select
                  className="flex-1 border-2 border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-orange-400"
                  value={currentEstado}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  disabled={updatingStatus}
                >
                  <option value="pendiente">Pendiente</option>
                  <option value="aprobado">Aprobado</option>
                  <option value="no_aprobada">No aprobada</option>
                  <option value="aprobado_sin_horas">Aprobado sin horas</option>
                </select>
                {updatingStatus && <Spinner size="sm" />}
              </div>
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-3 py-2 text-sm text-yellow-800 space-y-1">
                  <p>• <span className="font-semibold">Aprobado</span>: acredita <span className="font-semibold">{Number(sesion.duracion_hrs ?? 0)} horas</span> al tutor.</p>
                  <p>• <span className="font-semibold">Aprobado sin horas</span>: para sesiones no impartidas; no acredita horas.</p>
                </div>
            </div>
          </Card>
          
          {bitacora && (
            <>
              <Card title={`Comentarios (${comentarios.length})`}>
                {comentarios.length === 0 ? (
                  <p className="text-gray-400 text-sm">Sin comentarios aún.</p>
                ) : (
                  <ul className="space-y-3 max-h-64 overflow-y-auto">
                    {comentarios.map((c) => (
                      <li key={c.id} className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-medium text-gray-800">{c.revisor?.nombre_completo || 'Revisor'}</p>
                          <span className="text-xs text-gray-400">
                            {new Date(c.fecha_creacion).toLocaleDateString('es-MX')}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">{c.texto}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>

              <Card title="Añadir comentario">
                <form onSubmit={handleSubmit(onCommentSubmit)} className="space-y-3">
                  <div className="flex flex-col gap-1">
                    <textarea
                      rows={3}
                      placeholder="Escribe retroalimentación para el tutor..."
                      className="border-2 border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 resize-none"
                      {...register('texto', { required: 'El comentario no puede estar vacío' })}
                    />
                    {errors.texto && <p className="text-xs text-red-500">{errors.texto.message}</p>}
                  </div>
                  <Button type="submit" loading={sendingComment} className="w-full">
                    Publicar comentario
                  </Button>
                </form>
              </Card>
            </>
          )}
          <div className="pt-2">
            <Button 
              onClick={() => navigate(-1)}
              className="w-full flex items-center justify-center gap-2 py-3 text-base shadow-sm"
            >
              <CheckCircleIcon className="w-6 h-6" />
              Finalizar revisión y regresar
            </Button>
          </div>
        </div>
      </div>
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-4 transition-all">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-red-100 animate-fade-in-up">
            {/* Header del modal */}
            <div className="bg-red-50 p-4 border-b border-red-100 flex items-center gap-2">
              <ExclamationCircleIcon className="w-5 h-5 text-red-600" />
              <h3 className="text-red-800 font-semibold">Comentario Obligatorio</h3>
            </div>
            
            {/* Cuerpo del modal */}
            <div className="p-5 space-y-4">
              <p className="text-sm text-gray-600">
                Por favor, explica el motivo por el cual la bitácora <span className="font-semibold text-red-600">{pendingStatus === 'no_aprobada' ? 'no se aprueba' : 'no acredita horas'}</span>. Esto se le notificará al tutor:
              </p>
              
              <div>
                <textarea
                  rows={3}
                  className={`w-full border-2 rounded-xl px-3 py-2 text-sm outline-none resize-none transition-colors ${
                    motivoError 
                    ? 'border-red-400 focus:border-red-500 bg-red-50/50' 
                    : 'border-gray-200 focus:border-red-300'
                  }`}
                  placeholder="Escribe el motivo aquí..."
                  value={motivo}
                  onChange={(e) => { setMotivo(e.target.value); setMotivoError(false); }}
                  disabled={updatingStatus}
                />
                {motivoError && <p className="text-xs text-red-500 mt-1">Debes ingresar un motivo para continuar.</p>}
              </div>

              {/* Botones */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => { setModalOpen(false); setPendingStatus(null); setMotivo(''); }}
                  disabled={updatingStatus}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleModalSubmit}
                  disabled={updatingStatus}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2 shadow-sm shadow-red-200"
                >
                  {updatingStatus && <Spinner size="sm" />}
                  {updatingStatus ? 'Guardando...' : 'Confirmar y Guardar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
