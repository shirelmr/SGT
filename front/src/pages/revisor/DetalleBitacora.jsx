import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { getBitacora } from '../../api/bitacoras';
import { getComentarios, createComentario } from '../../api/comentarios';
import PageHeader from '../../components/shared/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Spinner from '../../components/ui/Spinner';

const estadoBadge = {
  pendiente: 'warning',
  revisado: 'info',
  aprobado: 'success',
};

export default function DetalleBitacora() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [bitacora, setBitacora] = useState(null);
  const [comentarios, setComentarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: { estado: 'pendiente' },
  });

  useEffect(() => {
    async function load() {
      try {
        const bRes = await getBitacora(id);
        setBitacora(bRes.data);
        try {
          const cRes = await getComentarios(id);
          setComentarios(cRes.data || []);
        } catch {
          setComentarios([]);
        }
      } catch {
        toast.error('Error al cargar la bitácora');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  async function onSubmit(data) {
    setSending(true);
    try {
      await createComentario({ ...data, id_bitacora: Number(id) });
      toast.success('Comentario enviado');
      reset({ estado: 'pendiente' });
      const cRes = await getComentarios(id);
      setComentarios(cRes.data || []);
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Error al enviar comentario');
    } finally {
      setSending(false);
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
        {/* Left: Bitácora content */}
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
                  <p className="text-xs text-gray-500 mb-1">Evidencia</p>
                  <a href={bitacora.evidencia} target="_blank" rel="noopener noreferrer" className="text-orange-500 hover:underline text-sm">{bitacora.evidencia}</a>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Right: Comments */}
        <div className="space-y-4">
          <Card title={`Comentarios (${comentarios.length})`}>
            {comentarios.length === 0 ? (
              <p className="text-gray-400 text-sm">Sin comentarios aún.</p>
            ) : (
              <ul className="space-y-3 max-h-64 overflow-y-auto">
                {comentarios.map((c) => (
                  <li key={c.id} className="p-3 rounded-xl bg-gray-50">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium text-gray-800">{c.revisor?.nombre_completo || 'Revisor'}</p>
                      <div className="flex items-center gap-2">
                        <Badge variant={estadoBadge[c.estado] || 'default'}>{c.estado}</Badge>
                        <span className="text-xs text-gray-400">
                          {new Date(c.fecha_creacion).toLocaleDateString('es-MX')}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">{c.texto}</p>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card title="Nuevo comentario">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Comentario</label>
                <textarea
                  rows={4}
                  placeholder="Escribe tu comentario..."
                  className="border-2 border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 resize-none"
                  {...register('texto', { required: 'El comentario es obligatorio' })}
                />
                {errors.texto && <p className="text-xs text-red-500">{errors.texto.message}</p>}
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Estado</label>
                <select
                  className="border-2 border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-orange-400"
                  {...register('estado')}
                >
                  <option value="pendiente">Pendiente</option>
                  <option value="revisado">Revisado</option>
                  <option value="aprobado">Aprobado</option>
                </select>
              </div>
              <Button type="submit" loading={sending} className="w-full">
                Enviar comentario
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
