import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { getSesion } from '../../api/sesiones';
import { getBitacora, createBitacora, updateBitacora } from '../../api/bitacoras';
import { getComentarios, marcarLeidos } from '../../api/comentarios';
import PageHeader from '../../components/shared/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Spinner from '../../components/ui/Spinner';

const estadoComentarioBadge = {
  pendiente: 'warning',
  revisado: 'info',
  aprobado: 'success',
};

export default function Bitacora() {
  const { id } = useParams();
  const [sesion, setSesion] = useState(null);
  const [bitacora, setBitacora] = useState(null);
  const [comentarios, setComentarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  useEffect(() => {
    async function load() {
      try {
        const sesRes = await getSesion(id);
        setSesion(sesRes.data);

        try {
          const bitRes = await getBitacora(id);
          setBitacora(bitRes.data);
          reset(bitRes.data);

          try {
            const comRes = await getComentarios(bitRes.data.id);
            setComentarios(comRes.data || []);
            await marcarLeidos(bitRes.data.id);
          } catch {
            setComentarios([]);
          }
        } catch {
          setBitacora(null);
          setEditing(true);
        }
      } catch {
        toast.error('Error al cargar la sesión');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, reset]);

  async function onSubmit(data) {
    setSaving(true);
    try {
      if (bitacora) {
        await updateBitacora(bitacora.id, data);
        toast.success('Bitácora actualizada');
      } else {
        const res = await createBitacora({ ...data, id_sesion: Number(id) });
        setBitacora(res.data);
        toast.success('Bitácora registrada');
      }
      setEditing(false);
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center py-16"><Spinner size="lg" /></div>;
  }

  return (
    <div>
      <PageHeader
        title="Bitácora de Sesión"
        subtitle={sesion ? `${sesion.tema} • ${new Date(sesion.fecha).toLocaleDateString('es-MX')}` : ''}
      />

      {/* Session info */}
      {sesion && (
        <Card className="mb-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-gray-500 text-xs mb-1">Fecha</p>
              <p className="font-medium text-gray-800">{new Date(sesion.fecha).toLocaleDateString('es-MX')}</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs mb-1">Hora</p>
              <p className="font-medium text-gray-800">{sesion.hora_inicio}</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs mb-1">Duración</p>
              <p className="font-medium text-gray-800">{sesion.duracion_hrs} hr(s)</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs mb-1">Beneficiario</p>
              <p className="font-medium text-gray-800">{sesion.beneficiario?.nombre_completo || '—'}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Bitácora form/view */}
      <Card title="Bitácora" className="mb-6">
        {!editing && bitacora ? (
          <div className="space-y-4">
            <div>
              <p className="text-xs text-gray-500 mb-1">Actividades realizadas</p>
              <p className="text-sm text-gray-800 whitespace-pre-wrap">{bitacora.actividades}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Logros</p>
              <p className="text-sm text-gray-800 whitespace-pre-wrap">{bitacora.logros}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Dificultades</p>
              <p className="text-sm text-gray-800 whitespace-pre-wrap">{bitacora.dificultades}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Plan para siguiente sesión</p>
              <p className="text-sm text-gray-800 whitespace-pre-wrap">{bitacora.plan_siguiente}</p>
            </div>
            {bitacora.evidencia && (
              <div>
                <p className="text-xs text-gray-500 mb-1">Evidencia</p>
                <a href={bitacora.evidencia} target="_blank" rel="noopener noreferrer" className="text-orange-500 hover:underline text-sm">{bitacora.evidencia}</a>
              </div>
            )}
            <Button variant="outline" onClick={() => { reset(bitacora); setEditing(true); }}>
              Editar
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {['actividades', 'logros', 'dificultades', 'plan_siguiente'].map((field) => (
              <div key={field} className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700 capitalize">
                  {field === 'plan_siguiente' ? 'Plan para siguiente sesión' : field.charAt(0).toUpperCase() + field.slice(1)}
                </label>
                <textarea
                  rows={3}
                  className="border-2 border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 resize-none"
                  {...register(field, { required: 'Obligatorio' })}
                />
                {errors[field] && <p className="text-xs text-red-500">{errors[field].message}</p>}
              </div>
            ))}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Evidencia (URL)</label>
              <input
                type="url"
                placeholder="https://..."
                className="border-2 border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                {...register('evidencia')}
              />
            </div>
            <div className="flex gap-3">
              {bitacora && (
                <Button type="button" variant="secondary" onClick={() => setEditing(false)}>
                  Cancelar
                </Button>
              )}
              <Button type="submit" loading={saving}>
                {bitacora ? 'Guardar cambios' : 'Registrar bitácora'}
              </Button>
            </div>
          </form>
        )}
      </Card>

      {/* Comentarios */}
      <Card title="Comentarios del Revisor">
        {comentarios.length === 0 ? (
          <p className="text-gray-400 text-sm">Sin comentarios aún.</p>
        ) : (
          <ul className="space-y-3">
            {comentarios.map((c) => (
              <li key={c.id} className="p-3 rounded-xl bg-gray-50">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium text-gray-800">{c.revisor?.nombre_completo || 'Revisor'}</p>
                  <div className="flex items-center gap-2">
                    <Badge variant={estadoComentarioBadge[c.estado] || 'default'}>{c.estado}</Badge>
                    <span className="text-xs text-gray-400">{new Date(c.fecha_creacion).toLocaleDateString('es-MX')}</span>
                  </div>
                </div>
                <p className="text-sm text-gray-600">{c.texto}</p>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
