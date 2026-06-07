import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { CheckCircleIcon, PhotoIcon } from '@heroicons/react/24/outline';
import { createPostulacion } from '../api/postulaciones';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import AuthLayout from '../components/layout/AuthLayout';

const YOUTUBE_RE = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[\w-]+/;

const inputCls = '!bg-white/20 !border-white/30 !text-[#f8f8ec] placeholder:!text-[#f8f8ec]/60';
const labelCls = '!text-[#f8f8ec]';
const textareaCls = `w-full border-2 rounded-xl px-3 py-2 text-sm outline-none transition-all duration-200 resize-none text-[#f8f8ec] placeholder:text-[#f8f8ec]/60`;

export default function Postulacion() {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [preview, setPreview] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const { onChange: onFileChange, ...fileRegister } = register('captura_duolingo');

  function handleFileChange(e) {
    const file = e.target.files[0];
    if (file) setPreview(URL.createObjectURL(file));
  }

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('nombre_completo', data.nombre_completo);
      fd.append('email', data.email);
      fd.append('matricula', data.matricula);
      fd.append('carrera', data.carrera);
      fd.append('semestre', data.semestre);
      fd.append('por_que_escogerte', data.por_que_escogerte);
      fd.append('por_que_interesa', data.por_que_interesa);
      if (data.link_video) fd.append('link_video', data.link_video);
      if (data.captura_duolingo?.[0]) fd.append('captura_duolingo', data.captura_duolingo[0]);

      await createPostulacion(fd);
      setSubmitted(true);
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Error al enviar la postulación');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout scrollable>
      {submitted ? (
        <div className="flex items-center justify-center min-h-[90vh] w-full">
          <div
            className="w-full max-w-lg rounded-2xl p-10 text-center animate-fade-in"
            style={{ backgroundColor: '#ee7e4c', boxShadow: '0 8px 40px rgba(74,31,6,0.18)' }}
          >
            <CheckCircleIcon className="w-16 h-16 mx-auto mb-4" style={{ color: '#f8f8ec' }} />
            <h2
              className="text-2xl font-bold mb-2"
              style={{ color: '#f8f8ec', fontFamily: 'Sora, sans-serif' }}
            >
              ¡Postulación enviada!
            </h2>
            <p className="text-sm max-w-sm mx-auto mb-6" style={{ color: 'rgba(248,248,236,0.75)' }}>
              El coordinador revisará tu postulación y recibirás una respuesta pronto.
              Si eres aceptado, recibirás un correo con instrucciones para crear tu cuenta.
            </p>
            <Link
              to="/login"
              className="text-sm font-semibold hover:underline"
              style={{ color: '#f8f8ec' }}
            >
              Volver al inicio de sesión
            </Link>
          </div>
        </div>
      ) : (
        <div
          className="w-full max-w-xl rounded-2xl p-10"
          style={{ backgroundColor: '#ee7e4c', boxShadow: '0 8px 40px rgba(74,31,6,0.18)' }}
        >
          <h2
            className="text-2xl font-bold mb-1"
            style={{ color: '#f8f8ec', fontFamily: 'Sora, sans-serif' }}
          >
            Postulación para Tutor
          </h2>
          <p className="text-sm mb-7" style={{ color: 'rgba(248,248,236,0.75)' }}>
            Completa el formulario para aplicar al programa Talk!
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Datos personales */}
            <section>
              <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'rgba(248,248,236,0.6)' }}>
                Datos personales
              </p>
              <div className="space-y-4">
                <Input label="Nombre completo" placeholder="Juan Pérez García" labelClassName={labelCls} className={inputCls} error={errors.nombre_completo?.message} {...register('nombre_completo', { required: 'Obligatorio' })} />
                <Input
                  label="Correo electrónico"
                  type="email"
                  placeholder="tu@email.com"
                  labelClassName={labelCls}
                  className={inputCls}
                  error={errors.email?.message}
                  {...register('email', {
                    required: 'Obligatorio',
                    pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Correo inválido' },
                  })}
                />
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Matrícula" placeholder="A01234567" labelClassName={labelCls} className={inputCls} error={errors.matricula?.message} {...register('matricula', { required: 'Obligatorio' })} />
                  <Input
                    label="Semestre"
                    type="number"
                    placeholder="6"
                    labelClassName={labelCls}
                    className={inputCls}
                    error={errors.semestre?.message}
                    {...register('semestre', {
                      required: 'Obligatorio',
                      min: { value: 1, message: 'Mín. 1' },
                      max: { value: 12, message: 'Máx. 12' },
                    })}
                  />
                </div>
                <Input label="Carrera" placeholder="Ingeniería en Sistemas Computacionales" labelClassName={labelCls} className={inputCls} error={errors.carrera?.message} {...register('carrera', { required: 'Obligatorio' })} />
              </div>
            </section>

            {/* Preguntas */}
            <section>
              <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'rgba(248,248,236,0.6)' }}>
                Preguntas de postulación
              </p>
              <div className="space-y-4">
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium" style={{ color: '#f8f8ec' }}>¿Por qué deberían escogerte?</label>
                  <textarea
                    rows={4}
                    placeholder="Describe tus habilidades, experiencia y por qué serías un buen tutor..."
                    className={`${textareaCls} ${errors.por_que_escogerte ? 'border-red-400' : ''}`}
                    style={{ backgroundColor: 'rgba(255,255,255,0.2)', borderColor: errors.por_que_escogerte ? '' : 'rgba(255,255,255,0.3)' }}
                    {...register('por_que_escogerte', { required: 'Obligatorio', minLength: { value: 30, message: 'Mínimo 30 caracteres' } })}
                  />
                  {errors.por_que_escogerte && <p className="text-xs text-red-200">{errors.por_que_escogerte.message}</p>}
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium" style={{ color: '#f8f8ec' }}>¿Por qué te interesa ser tutor?</label>
                  <textarea
                    rows={4}
                    placeholder="Comparte tu motivación para participar en el programa de tutorías..."
                    className={`${textareaCls} ${errors.por_que_interesa ? 'border-red-400' : ''}`}
                    style={{ backgroundColor: 'rgba(255,255,255,0.2)', borderColor: errors.por_que_interesa ? '' : 'rgba(255,255,255,0.3)' }}
                    {...register('por_que_interesa', { required: 'Obligatorio', minLength: { value: 30, message: 'Mínimo 30 caracteres' } })}
                  />
                  {errors.por_que_interesa && <p className="text-xs text-red-200">{errors.por_que_interesa.message}</p>}
                </div>
              </div>
            </section>

            {/* Archivos y links */}
            <section>
              <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'rgba(248,248,236,0.6)' }}>
                Archivos y links
              </p>
              <div className="space-y-4">
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium" style={{ color: '#f8f8ec' }}>
                    Captura de tu examen Duolingo
                  </label>
                  <label
                    className={`flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-4 cursor-pointer transition-all duration-200 hover:bg-white/10 ${errors.captura_duolingo ? 'border-red-400' : ''}`}
                    style={{ borderColor: errors.captura_duolingo ? '' : 'rgba(255,255,255,0.4)' }}
                  >
                    {preview ? (
                      <img src={preview} alt="Preview" className="max-h-40 rounded-lg object-contain" />
                    ) : (
                      <>
                        <PhotoIcon className="w-8 h-8 mb-2" style={{ color: 'rgba(248,248,236,0.5)' }} />
                        <span className="text-sm" style={{ color: 'rgba(248,248,236,0.7)' }}>Click para seleccionar imagen</span>
                        <span className="text-xs mt-1" style={{ color: 'rgba(248,248,236,0.5)' }}>JPG, PNG o WEBP · Máx. 5 MB</span>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      {...fileRegister}
                      onChange={(e) => { onFileChange(e); handleFileChange(e); }}
                    />
                  </label>
                  {errors.captura_duolingo && <p className="text-xs text-red-200">{errors.captura_duolingo.message}</p>}
                  {preview && (
                    <button
                      type="button"
                      onClick={() => setPreview(null)}
                      className="text-xs self-start hover:underline"
                      style={{ color: 'rgba(248,248,236,0.6)' }}
                    >
                      Quitar imagen
                    </button>
                  )}
                </div>

                <Input
                  label="Link de tu video de presentación (YouTube)"
                  type="url"
                  placeholder="https://youtube.com/watch?v=..."
                  labelClassName={labelCls}
                  className={inputCls}
                  error={errors.link_video?.message}
                  {...register('link_video', {
                    validate: (v) =>
                      !v || YOUTUBE_RE.test(v) || 'Debe ser un link válido de YouTube',
                  })}
                />
              </div>
            </section>

            <Button
              type="submit"
              loading={loading}
              size="lg"
              className="w-full !bg-white !text-[#4a1f06] hover:!bg-white/90"
            >
              Enviar postulación
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <p style={{ color: 'rgba(248,248,236,0.75)' }}>
              ¿Ya tienes cuenta?{' '}
              <Link to="/login" className="font-semibold hover:underline" style={{ color: '#f8f8ec' }}>
                Inicia sesión
              </Link>
            </p>
          </div>
          <p className="text-center text-xs mt-4" style={{ color: 'rgba(248,248,236,0.4)' }}>
            Sistema de Gestión Talk! &copy; 2026
          </p>
        </div>
      )}
    </AuthLayout>
  );
}
