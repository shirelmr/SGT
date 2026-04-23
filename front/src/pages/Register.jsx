import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';
import { BookOpenIcon } from '@heroicons/react/24/outline';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

const ROLES = [
  { value: 'tutor', label: 'Tutor' },
  { value: 'beneficiario', label: 'Beneficiario' },
  { value: 'revisor', label: 'Revisor' },
  { value: 'coordinador', label: 'Coordinador' },
];

export default function Register() {
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

  const onSubmit = async ({ nombre_completo, email, password, rol }) => {
    setLoading(true);
    setError('');
    try {
      const user = await registerUser({ nombre_completo, email, password, rol });
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
          {/* Logo */}
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
            <p className="text-gray-500 text-sm mt-1">Crear una cuenta nueva</p>
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

            {/* Rol select */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Rol</label>
              <select
                className={`border-2 border-gray-200 rounded-xl px-3 py-2 text-sm outline-none transition-all duration-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 bg-white ${errors.rol ? 'border-red-400' : ''}`}
                {...register('rol', { required: 'El rol es obligatorio' })}
              >
                <option value="">Selecciona un rol</option>
                {ROLES.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
              {errors.rol && <p className="text-xs text-red-500">{errors.rol.message}</p>}
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
