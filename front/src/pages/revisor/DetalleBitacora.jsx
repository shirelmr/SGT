import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { ArrowLeftIcon, PaperClipIcon } from '@heroicons/react/24/outline';
import { getBitacora, updateBitacora } from '../../api/bitacoras';
import { getComentarios, createComentario } from '../../api/comentarios';
import { getIncidenciasSesion } from '../../api/incidencias';
import PageHeader from '../../components/shared/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Spinner from '../../components/ui/Spinner';

const estadoBadge = {
  pendiente: 'warning',
  aprobado: 'success',
  no_aprobada: 'danger',
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
  const [comentarios, setComentarios] = useState([]);
  const [incidencias, setIncidencias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sendingComment, setSendingComment] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm({ defaultValues: { estado: 'pendiente' } });
  const estadoSeleccionado = watch('estado');


  useEffect(() => {
    async function load() {
      try {
        const bRes = await getBitacora(id);
        setBitacora(bRes.data);
        const idSesion = bRes.data.sesion?.id_sesion;
        const [cRes, iRes] = await Promise.allSettled([
          getComentarios(bRes.data.id),
          idSesion ? getIncidenciasSesion(idSesion) : Promise.resolve({ data: [] }),
        ]);
        setComentarios(cRes.status === 'fulfilled' ? cRes.value.data || [] : []);
        setIncidencias(iRes.status === 'fulfilled' ? iRes.value.data || [] : []);
      } catch {
        toast.error('Error al cargar la bitácora');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);


  async function onCommentSubmit(data) {
    setSendingComment(true);
    try {
      await createComentario({ texto: data.texto, estado: data.estado, id_bitacora: bitacora.id });
      toast.success(data.estado === 'aprobado' ? 'Bitácora aprobada y horas acreditadas' : 'Comentario enviado');
      reset({ estado: 'pendiente' });
      const [cRes, bRes] = await Promise.all([
        getComentarios(bitacora.id),
        getBitacora(id),
      ]);
      setComentarios(cRes.data || []);
      setBitacora(bRes.data);
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Error al enviar comentario');
    } finally {
      setSendingComment(false);
    }
  }

  async function handleStatusChange(nuevoEstado) {
    setUpdatingStatus(true);
    try {
      await updateBitacora(bitacora.id, { estado: nuevoEstado });
      setBitacora({ ...bitacora, estado: nuevoEstado });
      toast.success(`Estado actualizado a ${nuevoEstado}`);
    } catch (err) {
      console.error("Error del backend:", err);
      toast.error('Error al actualizar el estado');
    } finally {
      setUpdatingStatus(false);
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center py-16"><Spinner size="lg" /></div>;
  }

  if (!bitacora) {
    return (
      <div>
        <PageHeader title="Bitácora no encontrada" />
        <Button variant="secondary" onClick={() => navigate(-1)}>
          <ArrowLeftIcon className="w-4 h-4" /> Volver
        </Button>
      </div>
    );
  }

  const sesion = bitacora.sesion || {};
  const yaAprobada = comentarios.some((c) => c.estado === 'aprobado');

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
          <h1 className="font-sora text-2xl font-bold text-gray-900">Detalle Bitácora</h1>
          <p className="text-gray-500 text-sm">{sesion.tema} • {sesion.fecha ? new Date(sesion.fecha).toLocaleDateString('es-MX') : ''}</p>
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
            <div className="flex items-center gap-3">
              <select
                className="flex-1 border-2 border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-orange-400"
                value={bitacora.estado || 'pendiente'}
                onChange={(e) => handleStatusChange(e.target.value)}
                disabled={updatingStatus}
              >
                <option value="pendiente">Pendiente</option>
                <option value="aprobado">Aprobado</option>
                <option value="no_aprobada">No aprobada</option>
              </select>
              {updatingStatus && <Spinner size="sm" />}
            </div>
          </Card>
          
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
                <label className="text-sm font-medium text-gray-700">Estado</label>
                <select
                  className="border-2 border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-orange-400"
                  {...register('estado')}
                >
                  <option value="pendiente">Pendiente</option>
                  <option value="no_aprobada">No aprobada</option>
                  <option value="aprobado" disabled={yaAprobada}>
                    {yaAprobada ? 'Aprobado — Bitácora ya aprobada' : 'Aprobado'}
                  </option>
                </select>
              </div>
              {estadoSeleccionado === 'aprobado' && !yaAprobada && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-3 py-2 text-sm text-yellow-800">
                  Al aprobar esta bitácora se acreditarán <span className="font-semibold">{Number(sesion.duracion_hrs ?? 0)} horas</span> al tutor.
                </div>
              )}
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
                {estadoSeleccionado === 'aprobado' ? 'Aprobar bitácora' : 'Publicar comentario'}
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
