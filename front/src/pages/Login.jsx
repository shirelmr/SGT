import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';
import { BookOpenIcon } from '@heroicons/react/24/outline';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = async ({ email, password }) => {
    setLoading(true);
    setError('');
    try {
      const user = await login(email, password);
      toast.success(`¡Bienvenido, ${user.nombre_completo}!`);
      navigate(`/${user.rol}/dashboard`, { replace: true });
    } catch (err) {
      const msg = err?.response?.data?.error || 'Credenciales incorrectas';
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
      {/* Background decoration */}
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
          <div className="flex flex-col items-center mb-8">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 shadow-lg" style={{ backgroundColor: '#ee7e4c' }}>
              <BookOpenIcon className="w-8 h-8" style={{ color: '#4a1f06' }} />
            </div>
            <h1 className="font-sora text-3xl font-bold text-gray-900">
              SGT <span style={{ color: '#4a1f06' }}>Talk!</span>
            </h1>
            <p className="text-gray-500 text-sm mt-1">Sistema de Gestión Talk!</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
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
            <Input
              label="Contraseña"
              type="password"
              placeholder="••••••••"
              error={errors.password?.message}
              {...register('password', { required: 'La contraseña es obligatoria' })}
            />

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              loading={loading}
              className="w-full mt-2"
              size="lg"
            >
              Iniciar sesión
            </Button>
          </form>

          <p className="text-center text-gray-500 text-sm mt-6">
            ¿No tienes cuenta?{' '}
            <Link to="/register" className="font-semibold hover:underline" style={{ color: '#ee7e4c' }}>
              Regístrate
            </Link>
          </p>
          <p className="text-center text-sm mt-2">
            <Link
              to="/postulacion"
              className="font-semibold hover:underline"
              style={{ color: '#4a1f06' }}
            >
              ¿Quieres ser tutor? → Postúlate aquí
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
