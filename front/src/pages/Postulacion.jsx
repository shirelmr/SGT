import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { BookOpenIcon, CheckCircleIcon, PhotoIcon } from '@heroicons/react/24/outline';
import { createPostulacion } from '../api/postulaciones';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

const YOUTUBE_RE = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[\w-]+/;

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
    <div className="min-h-screen py-10 px-4" style={{ backgroundColor: '#ee7e4c' }}>
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #f8f8ec, transparent)' }} />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #f8f8ec, transparent)' }} />
      </div>

      <div className="relative max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 shadow-lg"
            style={{ backgroundColor: '#f8f8ec' }}>
            <BookOpenIcon className="w-8 h-8" style={{ color: '#4a1f06' }} />
          </div>
          <h1 className="font-sora text-3xl font-bold text-white">SGT <span style={{ color: '#4a1f06' }}>Talk!</span></h1>
          <p className="text-white/80 text-sm mt-1">Postulación para ser Tutor</p>
        </div>

        {submitted ? (
          /* ── Success state ── */
          <div className="bg-white rounded-2xl shadow-2xl p-10 text-center">
            <CheckCircleIcon className="w-16 h-16 mx-auto mb-4 text-green-500" />
            <h2 className="font-sora text-2xl font-bold text-gray-900 mb-2">¡Postulación enviada!</h2>
            <p className="text-gray-500 text-sm max-w-sm mx-auto mb-6">
              El coordinador revisará tu postulación y recibirás una respuesta pronto.
              Si eres aceptado, recibirás un correo con instrucciones para crear tu cuenta.
            </p>
            <Link to="/login" className="text-sm font-semibold hover:underline" style={{ color: '#ee7e4c' }}>
              Volver al inicio de sesión
            </Link>
          </div>
        ) : (
          /* ── Form ── */
          <div className="bg-white rounded-2xl shadow-2xl p-8">
            <h2 className="font-sora text-xl font-bold text-gray-900 mb-6">Formulario de postulación</h2>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* ── Datos personales ── */}
              <section>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Datos personales</p>
                <div className="space-y-4">
                  <Input
                    label="Nombre completo"
                    placeholder="Juan Pérez García"
                    error={errors.nombre_completo?.message}
                    {...register('nombre_completo', { required: 'Obligatorio' })}
                  />
                  <Input
                    label="Correo electrónico"
                    type="email"
                    placeholder="tu@email.com"
                    error={errors.email?.message}
                    {...register('email', {
                      required: 'Obligatorio',
                      pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Correo inválido' },
                    })}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Matrícula"
                      placeholder="A01234567"
                      error={errors.matricula?.message}
                      {...register('matricula', { required: 'Obligatorio' })}
                    />
                    <Input
                      label="Semestre"
                      type="number"
                      placeholder="6"
                      error={errors.semestre?.message}
                      {...register('semestre', {
                        required: 'Obligatorio',
                        min: { value: 1, message: 'Mín. 1' },
                        max: { value: 12, message: 'Máx. 12' },
                      })}
                    />
                  </div>
                  <Input
                    label="Carrera"
                    placeholder="Ingeniería en Sistemas Computacionales"
                    error={errors.carrera?.message}
                    {...register('carrera', { required: 'Obligatorio' })}
                  />
                </div>
              </section>

              {/* ── Preguntas ── */}
              <section>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Preguntas de postulación</p>
                <div className="space-y-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-gray-700">¿Por qué deberían escogerte?</label>
                    <textarea
                      rows={4}
                      placeholder="Describe tus habilidades, experiencia y por qué serías un buen tutor..."
                      className={`border-2 border-gray-200 rounded-xl px-3 py-2 text-sm outline-none transition-all duration-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 resize-none ${errors.por_que_escogerte ? 'border-red-400' : ''}`}
                      {...register('por_que_escogerte', { required: 'Obligatorio', minLength: { value: 30, message: 'Mínimo 30 caracteres' } })}
                    />
                    {errors.por_que_escogerte && <p className="text-xs text-red-500">{errors.por_que_escogerte.message}</p>}
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-gray-700">¿Por qué te interesa ser tutor?</label>
                    <textarea
                      rows={4}
                      placeholder="Comparte tu motivación para participar en el programa de tutorías..."
                      className={`border-2 border-gray-200 rounded-xl px-3 py-2 text-sm outline-none transition-all duration-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 resize-none ${errors.por_que_interesa ? 'border-red-400' : ''}`}
                      {...register('por_que_interesa', { required: 'Obligatorio', minLength: { value: 30, message: 'Mínimo 30 caracteres' } })}
                    />
                    {errors.por_que_interesa && <p className="text-xs text-red-500">{errors.por_que_interesa.message}</p>}
                  </div>
                </div>
              </section>

              {/* ── Archivos y links ── */}
              <section>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Archivos y links</p>
                <div className="space-y-4">
                  {/* File upload with preview */}
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-gray-700">
                      Captura de tu examen Duolingo
                    </label>
                    <label className={`flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-4 cursor-pointer transition-all duration-200 hover:border-orange-400 hover:bg-orange-50 ${errors.captura_duolingo ? 'border-red-400' : 'border-gray-200'}`}>
                      {preview ? (
                        <img src={preview} alt="Preview" className="max-h-40 rounded-lg object-contain" />
                      ) : (
                        <>
                          <PhotoIcon className="w-8 h-8 text-gray-300 mb-2" />
                          <span className="text-sm text-gray-500">Click para seleccionar imagen</span>
                          <span className="text-xs text-gray-400 mt-1">JPG, PNG o WEBP · Máx. 5 MB</span>
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        {...fileRegister}
                        onChange={(e) => {
                          onFileChange(e);
                          handleFileChange(e);
                        }}
                      />
                    </label>
                    {errors.captura_duolingo && <p className="text-xs text-red-500">{errors.captura_duolingo.message}</p>}
                    {preview && (
                      <button type="button" onClick={() => setPreview(null)}
                        className="text-xs text-gray-400 hover:text-red-500 self-start">
                        Quitar imagen
                      </button>
                    )}
                  </div>

                  <Input
                    label="Link de tu video de presentación (YouTube)"
                    type="url"
                    placeholder="https://youtube.com/watch?v=..."
                    error={errors.link_video?.message}
                    {...register('link_video', {
                      validate: (v) =>
                        !v || YOUTUBE_RE.test(v) || 'Debe ser un link válido de YouTube (youtube.com o youtu.be)',
                    })}
                  />
                </div>
              </section>

              <Button type="submit" loading={loading} className="w-full" size="lg">
                Enviar postulación
              </Button>
            </form>

            <p className="text-center text-gray-400 text-xs mt-6">
              ¿Ya tienes cuenta?{' '}
              <Link to="/login" className="font-semibold hover:underline" style={{ color: '#ee7e4c' }}>
                Inicia sesión
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
