import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import AuthLayout from '../components/layout/AuthLayout';

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
    <AuthLayout>
      <div
          className="w-full max-w-lg rounded-2xl p-10"
          style={{ backgroundColor: '#ee7e4c', boxShadow: '0 8px 40px rgba(74,31,6,0.18)' }}
        >
          <h2
            className="text-2xl font-bold mb-1"
            style={{ color: '#f8f8ec', fontFamily: 'Sora, sans-serif' }}
          >
            Iniciar sesión
          </h2>
          <p className="text-sm mb-7" style={{ color: 'rgba(248,248,236,0.75)' }}>
            Accede a tu cuenta del Sistema Talk!
          </p>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
            <Input
              label="Correo electrónico"
              type="email"
              placeholder="tu@email.com"
              labelClassName="!text-white"
              className="!bg-white/20 !border-white/30 !text-white placeholder:!text-white/60"
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
              labelClassName="!text-white"
              className="!bg-white/20 !border-white/30 !text-white placeholder:!text-white/60"
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
              size="lg"
              className="w-full !bg-white !text-[#4a1f06] hover:!bg-white/90"
            >
              Entrar
            </Button>
          </form>

          <div className="mt-6 space-y-2 text-center text-sm">
            <p style={{ color: 'rgba(248,248,236,0.75)' }}>
              ¿No tienes cuenta?{' '}
              <Link to="/register" className="font-semibold hover:underline" style={{ color: '#f8f8ec' }}>
                Regístrate
              </Link>
            </p>
            <p>
              <Link to="/postulacion" className="font-semibold hover:underline" style={{ color: 'rgba(248,248,236,0.85)' }}>
                ¿Quieres ser tutor? → Postúlate aquí
              </Link>
            </p>
          </div>

          <p className="text-center text-xs mt-8" style={{ color: 'rgba(248,248,236,0.4)' }}>
            Sistema de Gestión Talk! &copy; 2026
          </p>
        </div>
    </AuthLayout>
  );
}
