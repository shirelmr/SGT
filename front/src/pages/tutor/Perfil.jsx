import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';
import { getTutorPerfil, updateTutorPerfil } from '../../api/tutor';
import PageHeader from '../../components/shared/PageHeader';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import { useState } from 'react';

export default function Perfil() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [perfil, setPerfil] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm();

  useEffect(() => {
    getTutorPerfil()
      .then((res) => {
        setPerfil(res.data);
        reset({ link_video: res.data.link_video ?? '', link_zoom: res.data.link_zoom ?? '' });
      })
      .catch(() => toast.error('No se pudo cargar el perfil'))
      .finally(() => setLoading(false));
  }, [reset]);

  const onSubmit = async (data) => {
    setSaving(true);
    try {
      await updateTutorPerfil({ link_video: data.link_video || null, link_zoom: data.link_zoom || null });
      toast.success('Perfil actualizado');
      reset(data);
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Mi Perfil"
        subtitle="Actualiza tu información como tutor"
      />

      <div className="max-w-lg bg-white rounded-2xl shadow-sm p-6">
        {/* Read-only account info */}
        <div className="mb-6 pb-6 border-b border-gray-100">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Cuenta</p>
          <div className="space-y-1">
            <p className="text-sm text-gray-800 font-medium">{user?.nombre_completo}</p>
            <p className="text-sm text-gray-500">{user?.email}</p>
          </div>
        </div>

        {/* Read-only tutor info */}
        <div className="mb-6 pb-6 border-b border-gray-100 space-y-3">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Datos de tutor</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Matrícula</p>
              <p className="text-sm text-gray-800 font-medium">{perfil?.matricula || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Semestre</p>
              <p className="text-sm text-gray-800 font-medium">{perfil?.semestre || '—'}</p>
            </div>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Carrera</p>
            <p className="text-sm text-gray-800 font-medium">{perfil?.carrera || '—'}</p>
          </div>
        </div>

        {/* Editable fields */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Video de presentación</p>

          <Input
            label="Link de video"
            placeholder="https://..."
            error={errors.link_video?.message}
            {...register('link_video')}
          />

          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide pt-2">Sesiones en línea</p>

          <Input
            label="Link de Zoom / Meet"
            placeholder="https://zoom.us/j/..."
            error={errors.link_zoom?.message}
            {...register('link_zoom')}
          />

          <div className="pt-2">
            <Button type="submit" loading={saving} disabled={!isDirty}>
              Guardar cambios
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
