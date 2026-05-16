import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { PaperClipIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { getSesion } from '../../api/sesiones';
import { getBitacora, createBitacora, updateBitacora, uploadEvidencia } from '../../api/bitacoras';
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

const estadoBitacoraBadge = {
  pendiente: 'warning',
  revisado: 'info',
  aprobado: 'success',
};

const estadoBitacoraLabel = {
  pendiente: 'Pendiente de revisión',
  revisado: 'En revisión',
  aprobado: 'Aprobada',
};

function getFileUrl(p) {
  if (!p) return null;
  if (p.startsWith('http')) return p;
  const base = import.meta.env.VITE_API_URL?.replace('/api', '') || '';
  return `${base}${p}`;
}

function isImage(p) { return /\.(jpg|jpeg|png|webp)$/i.test(p); }
function isPdf(p) { return /\.pdf$/i.test(p); }

export default function Bitacora() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [sesion, setSesion] = useState(null);
  const [bitacora, setBitacora] = useState(null);
  const [comentarios, setComentarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [evidenciaUrl, setEvidenciaUrl] = useState('');
  const [uploading, setUploading] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  useEffect(() => {
    async function load() {
      try {
        const sesRes = await getSesion(id);
        setSesion(sesRes.data);
        try {
          const bitRes = await getBitacora(id);
          setBitacora(bitRes.data);
          setEvidenciaUrl(bitRes.data.evidencia || '');
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
          setEvidenciaUrl('');
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

  async function handleFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await uploadEvidencia(formData);
      setEvidenciaUrl(res.data.url);
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Error al subir el archivo');
    } finally {
      setUploading(false);
    }
  }

  async function onSubmit(data) {
    setSaving(true);
    try {
      const payload = { ...data, evidencia: evidenciaUrl || null };
      if (bitacora) {
        await updateBitacora(bitacora.id, payload);
        setBitacora((prev) => ({ ...prev, ...payload }));
        toast.success('Bitácora actualizada');
      } else {
        const res = await createBitacora({ ...payload, id_sesion: Number(id) });
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
      {/* <PageHeader
        title="Bitácora de Sesión"
        subtitle={sesion ? `${sesion.tema} • ${new Date(sesion.fecha).toLocaleDateString('es-MX')}` : ''}
      /> */}

      <PageHeader
        title={
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(-1)}
              className="p-1 hover:bg-gray-100 rounded-lg transition-colors text-gray-500"
              title="Regresar"
            >
              <ArrowLeftIcon className="w-5 h-5" />
            </button>
            Bitácora de Sesión
          </div>
        }
        subtitle={sesion ? `${sesion.tema} • ${new Date(sesion.fecha).toLocaleDateString('es-MX')}` : ''}
      />

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

      <Card title="Bitácora" className="mb-6">
        {bitacora && (
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
            <span className="text-xs text-gray-500">Estado:</span>
            <Badge variant={estadoBitacoraBadge[bitacora.estado] || 'default'}>
              {estadoBitacoraLabel[bitacora.estado] || bitacora.estado}
            </Badge>
          </div>
        )}
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
                <p className="text-xs text-gray-500 mb-2">Evidencia</p>
                {isImage(bitacora.evidencia) ? (
                  <a href={getFileUrl(bitacora.evidencia)} target="_blank" rel="noopener noreferrer">
                    <img
                      src={getFileUrl(bitacora.evidencia)}
                      alt="Evidencia"
                      className="max-h-48 rounded-xl object-cover border border-gray-100"
                    />
                  </a>
                ) : (
                  <a
                    href={getFileUrl(bitacora.evidencia)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-orange-500 hover:underline text-sm"
                  >
                    <PaperClipIcon className="w-4 h-4" />
                    {isPdf(bitacora.evidencia) ? 'Ver PDF' : 'Ver archivo'}
                  </a>
                )}
              </div>
            )}
            <Button variant="outline" onClick={() => { setEvidenciaUrl(bitacora.evidencia || ''); reset(bitacora); setEditing(true); }}>
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

            {/* Evidencia: file upload */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">
                Evidencia <span className="text-gray-400 font-normal">(imagen o PDF, máx. 5 MB)</span>
              </label>
              {evidenciaUrl ? (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border-2 border-gray-100">
                  {isImage(evidenciaUrl) ? (
                    <img src={getFileUrl(evidenciaUrl)} alt="preview" className="h-12 w-12 object-cover rounded-lg" />
                  ) : (
                    <PaperClipIcon className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  )}
                  <span className="text-sm text-gray-600 truncate flex-1">
                    {evidenciaUrl.split('/').pop()}
                  </span>
                  <button
                    type="button"
                    onClick={() => setEvidenciaUrl('')}
                    className="p-1 rounded-lg hover:bg-gray-200 text-gray-400"
                  >
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="flex items-center justify-center gap-2 border-2 border-dashed border-gray-200 rounded-xl px-4 py-6 cursor-pointer hover:border-orange-300 hover:bg-orange-50 transition-colors">
                  {uploading ? (
                    <Spinner size="sm" />
                  ) : (
                    <>
                      <PaperClipIcon className="w-5 h-5 text-gray-400" />
                      <span className="text-sm text-gray-500">Haz clic para subir archivo</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp,.pdf"
                    className="hidden"
                    onChange={handleFileChange}
                    disabled={uploading}
                  />
                </label>
              )}
            </div>

            <div className="flex gap-3">
              {bitacora && (
                <Button type="button" variant="secondary" onClick={() => setEditing(false)}>
                  Cancelar
                </Button>
              )}
              <Button type="submit" loading={saving} disabled={uploading}>
                {bitacora ? 'Guardar cambios' : 'Registrar bitácora'}
              </Button>
            </div>
          </form>
        )}
      </Card>

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
