import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import AuthLayout from '../components/layout/AuthLayout';

const inputCls = '!bg-white/20 !border-white/30 !text-[#f8f8ec] placeholder:!text-[#f8f8ec]/60';
const labelCls = '!text-[#f8f8ec]';

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
    <AuthLayout scrollable>
      <div
        className="w-full max-w-lg rounded-2xl p-10"
        style={{ backgroundColor: '#ee7e4c', boxShadow: '0 8px 40px rgba(74,31,6,0.18)' }}
      >
        <h2
          className="text-2xl font-bold mb-1"
          style={{ color: '#f8f8ec', fontFamily: 'Sora, sans-serif' }}
        >
          Registro de Tutor
        </h2>
        <p className="text-sm mb-7" style={{ color: 'rgba(248,248,236,0.75)' }}>
          Crea tu cuenta como tutor del programa Talk!
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Nombre completo"
            type="text"
            placeholder="Juan Pérez"
            labelClassName={labelCls}
            className={inputCls}
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
            labelClassName={labelCls}
            className={inputCls}
            error={errors.email?.message}
            {...register('email', {
              required: 'El correo es obligatorio',
              pattern: {
                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: 'Correo inválido',
              },
            })}
          />

          <div
            className="space-y-3 rounded-xl border-2 p-4"
            style={{ borderColor: 'rgba(255,255,255,0.25)', backgroundColor: 'rgba(255,255,255,0.1)' }}
          >
            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'rgba(248,248,236,0.7)' }}>
              Datos del tutor
            </p>
            <Input label="Matrícula" placeholder="A01234567" labelClassName={labelCls} className={inputCls} error={errors.matricula?.message} {...register('matricula', { required: 'La matrícula es obligatoria' })} />
            <Input label="Carrera" placeholder="Ingeniería en Sistemas" labelClassName={labelCls} className={inputCls} error={errors.carrera?.message} {...register('carrera', { required: 'La carrera es obligatoria' })} />
            <Input
              label="Semestre"
              type="number"
              placeholder="6"
              labelClassName={labelCls}
              className={inputCls}
              error={errors.semestre?.message}
              {...register('semestre', {
                required: 'El semestre es obligatorio',
                min: { value: 1, message: 'Mínimo 1' },
                max: { value: 12, message: 'Máximo 12' },
              })}
            />
          </div>

          <Input
            label="Contraseña"
            type="password"
            placeholder="••••••••"
            labelClassName={labelCls}
            className={inputCls}
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
            labelClassName={labelCls}
            className={inputCls}
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

          <Button
            type="submit"
            loading={loading}
            size="lg"
            className="w-full !bg-white !text-[#4a1f06] hover:!bg-white/90"
          >
            Crear cuenta
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
        <p className="text-center text-xs mt-6" style={{ color: 'rgba(248,248,236,0.4)' }}>
          Sistema de Gestión Talk! &copy; 2026
        </p>
      </div>
    </AuthLayout>
  );
}
