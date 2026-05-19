import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';
import { BookOpenIcon } from '@heroicons/react/24/outline';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

export default function RegisterTutor() {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm();

  const password = watch('password');

  const onSubmit = async (data) => {
    setLoading(true);
    setError('');
    const { confirmPassword, ...payload } = data;
    payload.rol = 'tutor';
    if (payload.semestre) payload.semestre = Number(payload.semestre);

    try {
      const user = await registerUser(payload);
      toast.success(`¡Bienvenido, ${user.nombre_completo}!`);
      navigate(`/${user.rol}/dashboard`, { replace: true });
    } catch (err) {
      const msg = err?.response?.data?.error || 'Error al registrarse. Intenta de nuevo.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ backgroundColor: '#ee7e4c' }}
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-40 -right-40 w-96 h-96 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #f8f8ec, transparent)' }}
        />
        <div
          className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #f8f8ec, transparent)' }}
        />
      </div>

      <div className="relative w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="flex flex-col items-center mb-6">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 shadow-lg"
              style={{ backgroundColor: '#ee7e4c' }}
            >
              <BookOpenIcon className="w-8 h-8" style={{ color: '#4a1f06' }} />
            </div>
            <h1 className="font-sora text-3xl font-bold text-gray-900">
              SGT <span style={{ color: '#4a1f06' }}>Talk!</span>
            </h1>
            <p className="text-gray-500 text-sm mt-1">Registro de Tutor</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Nombre completo"
              type="text"
              placeholder="Juan Pérez"
              error={errors.nombre_completo?.message}
              {...register('nombre_completo', {
                required: 'El nombre es obligatorio',
                minLength: { value: 3, message: 'Mínimo 3 caracteres' },
              })}
            />

            <Input
              label="Correo electrónico"
              type="email"
              placeholder="tu@email.com"
              error={errors.email?.message}
              {...register('email', {
                required: 'El correo es obligatorio',
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: 'Correo inválido',
                },
              })}
            />

            <div className="space-y-3 rounded-xl border-2 border-orange-100 bg-orange-50 p-4">
              <p className="text-xs font-semibold text-orange-700 uppercase tracking-wide">Datos del tutor</p>
              <Input
                label="Matrícula"
                placeholder="A01234567"
                error={errors.matricula?.message}
                {...register('matricula')}
              />
              <Input
                label="Carrera"
                placeholder="Ingeniería en Sistemas"
                error={errors.carrera?.message}
                {...register('carrera')}
              />
              <Input
                label="Semestre"
                type="number"
                placeholder="6"
                error={errors.semestre?.message}
                {...register('semestre', {
                  min: { value: 1, message: 'Mínimo 1' },
                  max: { value: 12, message: 'Máximo 12' },
                })}
              />
            </div>

            <Input
              label="Contraseña"
              type="password"
              placeholder="••••••••"
              error={errors.password?.message}
              {...register('password', {
                required: 'La contraseña es obligatoria',
                minLength: { value: 6, message: 'Mínimo 6 caracteres' },
              })}
            />

            <Input
              label="Confirmar contraseña"
              type="password"
              placeholder="••••••••"
              error={errors.confirmPassword?.message}
              {...register('confirmPassword', {
                required: 'Confirma tu contraseña',
                validate: (v) => v === password || 'Las contraseñas no coinciden',
              })}
            />

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <Button type="submit" loading={loading} className="w-full mt-2" size="lg">
              Crear cuenta
            </Button>
          </form>

          <p className="text-center text-gray-500 text-sm mt-6">
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" className="font-semibold hover:underline" style={{ color: '#ee7e4c' }}>
              Inicia sesión
            </Link>
          </p>
          <p className="text-center text-gray-400 text-xs mt-3">
            Sistema de Gestión Talk! &copy; 2026
          </p>
        </div>
      </div>
    </div>
  );
}
