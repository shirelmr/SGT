import { useState } from 'react';
import {
  CalendarDaysIcon, LinkIcon, CheckCircleIcon, XCircleIcon, ClockIcon,
  BookOpenIcon, StarIcon, TrophyIcon,
} from '@heroicons/react/24/outline';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';
import { useBeneficiarioDashboard } from '../../hooks/useBeneficiarioDashboard';
import { confirmarAsistencia, cancelarAsistencia } from '../../api/asistencias';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Spinner from '../../components/ui/Spinner';
import ProgressBar from '../../components/ui/ProgressBar';

const estadoBadge = {
  programada: 'info',
  realizada: 'success',
  cancelada: 'danger',
};

const frases = [
  '¡Hoy es un gran día para aprender inglés! 🌟',
  '¡Cada sesión te acerca más a tu meta! 💪',
  '¡El inglés abre puertas, sigue adelante! 🚀',
  '¡Tú puedes lograrlo, un paso a la vez! ✨',
  '¡Aprender un idioma es un superpoder! 🦸',
  '¡Hoy practicas, mañana brillas! 🌈',
  '¡La constancia es la clave del éxito! 🔑',
];

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Buenos días';
  if (h < 18) return 'Buenas tardes';
  return 'Buenas noches';
}

function todayLabel() {
  return new Date().toLocaleDateString('es-MX', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
}

function CalendarioSesiones({ sesiones }) {
  const [mes, setMes] = useState(() => {
    const hoy = new Date();
    return new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  });

  const year = mes.getFullYear();
  const month = mes.getMonth();
  const primerDia = new Date(year, month, 1).getDay();
  const diasEnMes = new Date(year, month + 1, 0).getDate();

  const fechasConSesion = new Set(
    sesiones.map((s) => {
      const d = new Date(s.fecha);
      return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    })
  );

  const hoy = new Date();
  const nombreMes = mes.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' });

  const celdas = [];
  for (let i = 0; i < primerDia; i++) celdas.push(null);
  for (let d = 1; d <= diasEnMes; d++) celdas.push(d);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <button onClick={() => setMes(new Date(year, month - 1, 1))} className="text-gray-400 hover:text-gray-600 px-2">&#8249;</button>
        <span className="text-sm font-semibold text-gray-700 capitalize">{nombreMes}</span>
        <button onClick={() => setMes(new Date(year, month + 1, 1))} className="text-gray-400 hover:text-gray-600 px-2">&#8250;</button>
      </div>
      <div className="grid grid-cols-7 text-center text-xs text-gray-400 mb-1">
        {['Do','Lu','Ma','Mi','Ju','Vi','Sa'].map((d) => <span key={d}>{d}</span>)}
      </div>
      <div className="grid grid-cols-7 text-center text-xs gap-y-1">
        {celdas.map((dia, i) => {
          if (!dia) return <span key={i} />;
          const key = `${year}-${month}-${dia}`;
          const tieneSesion = fechasConSesion.has(key);
          const esHoy = hoy.getFullYear() === year && hoy.getMonth() === month && hoy.getDate() === dia;
          return (
            <span key={i} className={`w-7 h-7 mx-auto flex items-center justify-center rounded-full
              ${esHoy ? 'bg-orange-500 text-white font-bold' : tieneSesion ? 'bg-orange-100 text-orange-600 font-semibold' : 'text-gray-600'}`}>
              {dia}
            </span>
          );
        })}
      </div>
      <p className="text-xs text-gray-400 text-center">
        <span className="inline-block w-2 h-2 rounded-full bg-orange-100 border border-orange-300 mr-1" />
        Días con sesión
      </p>
    </div>
  );
}

const CustomBarTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 px-4 py-2 text-sm">
      <p className="font-semibold text-gray-700">{label}</p>
      <p className="text-orange-500 font-bold">{payload[0].value} sesiones</p>
    </div>
  );
};

function getSesionesPorMes(sesiones) {
  const meses = {};
  sesiones.forEach((s) => {
    const d = new Date(s.fecha);
    const key = d.toLocaleDateString('es-MX', { month: 'short', year: '2-digit' });
    meses[key] = (meses[key] || 0) + 1;
  });
  return Object.entries(meses)
    .map(([mes, sesiones]) => ({ mes, sesiones }))
    .slice(-6);
}

export default function Tablero() {
  const { user } = useAuth();
  const { loading, sesiones, proxima, ultimas, setSesiones } = useBeneficiarioDashboard();
  const [actionLoading, setActionLoading] = useState({});

  async function handleConfirmar(sesionId) {
    setActionLoading((p) => ({ ...p, [sesionId]: 'confirmar' }));
    try {
      await confirmarAsistencia(sesionId);
      toast.success('Asistencia confirmada');
      setSesiones((prev) => prev.map((s) => s.id === sesionId ? { ...s, confirma_benef: true } : s));
    } catch {
      toast.error('Error al confirmar');
    } finally {
      setActionLoading((p) => ({ ...p, [sesionId]: null }));
    }
  }

  async function handleCancelar(sesionId) {
    setActionLoading((p) => ({ ...p, [sesionId]: 'cancelar' }));
    try {
      await cancelarAsistencia(sesionId);
      toast.success('Asistencia cancelada');
      setSesiones((prev) => prev.map((s) => s.id === sesionId ? { ...s, confirma_benef: false } : s));
    } catch {
      toast.error('Error al cancelar');
    } finally {
      setActionLoading((p) => ({ ...p, [sesionId]: null }));
    }
  }

  if (loading) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>;

  const sesionesRealizadas = sesiones.filter(s => s.estado === 'realizada').length;
  const sesionesProgamadas = sesiones.filter(s => s.estado === 'programada').length;
  const sesionesCanceladas = sesiones.filter(s => s.estado === 'cancelada').length;
  const totalSesiones = sesiones.length;
  const porcentaje = totalSesiones > 0 ? Math.round((sesionesRealizadas / totalSesiones) * 100) : 0;
  const sesionesPorMes = getSesionesPorMes(sesiones);
  const firstName = user?.nombre_completo?.split(' ')[0] ?? 'Estudiante';
  const fraseDelDia = frases[new Date().getDay() % frases.length];

  const statCards = [
    { label: 'Sesiones Realizadas', value: sesionesRealizadas, icon: TrophyIcon, color: '#22c55e', bg: '#f0fdf4' },
    { label: 'Sesiones Programadas', value: sesionesProgamadas, icon: CalendarDaysIcon, color: '#3b82f6', bg: '#eff6ff' },
    { label: 'Sesiones Canceladas', value: sesionesCanceladas, icon: XCircleIcon, color: '#ef4444', bg: '#fef2f2' },
    { label: 'Total de Sesiones', value: totalSesiones, icon: BookOpenIcon, color: '#f97316', bg: '#fff7ed' },
  ];

  return (
    <div className="space-y-6 pb-8">

      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-7 py-5 flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-400 font-medium capitalize">{todayLabel()}</p>
          <h1 className="font-sora text-2xl font-bold text-gray-900 mt-0.5">
            {greeting()}, {firstName} &#128075;
          </h1>
          <p className="text-orange-500 text-sm font-medium mt-1">{fraseDelDia}</p>
        </div>
        <div className="hidden sm:flex items-center gap-2 bg-orange-50 px-4 py-2 rounded-xl">
          <StarIcon className="w-5 h-5 text-orange-400" />
          <span className="text-orange-600 font-semibold text-sm">{porcentaje}% completado</span>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {statCards.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white rounded-2xl shadow-sm p-5 flex items-center gap-4 border border-gray-100">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: bg }}>
              <Icon className="w-6 h-6" style={{ color }} />
            </div>
            <div>
              <p className="text-gray-500 text-xs">{label}</p>
              <p className="font-sora text-2xl font-bold text-gray-900">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Proxima sesion + Progreso */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card title="Próxima Sesión" borderColor="#f97316" className="lg:col-span-2">
          {proxima ? (
            <div className="flex flex-col gap-3 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <CalendarDaysIcon className="w-5 h-5 text-orange-500 flex-shrink-0" />
                <span className="font-medium capitalize">
                  {new Date(proxima.fecha).toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <ClockIcon className="w-5 h-5 text-orange-500 flex-shrink-0" />
                <span className="font-medium">{proxima.hora_inicio} hrs</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">{proxima.tema}</p>
                <p className="text-sm text-gray-500">Tutor: {proxima.tutor?.nombre_completo}</p>
              </div>

              {proxima.confirma_benef && proxima.link_sesion ? (
                <a
                  href={proxima.link_sesion}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-orange-600 hover:underline text-sm font-bold"
                >
                  <LinkIcon className="w-4 h-4" /> Unirse a la sesión ahora
                </a>
              ) : (
                <div className="bg-gray-50 p-3 rounded-lg border border-dashed border-gray-300">
                  <p className="text-xs text-gray-500 italic">
                    El enlace aparecerá aquí una vez que confirmes tu asistencia.
                  </p>
                </div>
              )}

              <div className="flex flex-wrap gap-3 pt-1">
                {!proxima.confirma_benef ? (
                  <button
                    onClick={() => handleConfirmar(proxima.id)}
                    disabled={!!actionLoading[proxima.id]}
                    className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50"
                  >
                    <CheckCircleIcon className="w-5 h-5" />
                    {actionLoading[proxima.id] === 'confirmar' ? 'Confirmando...' : 'Confirmar Asistencia'}
                  </button>
                ) : (
                  <>
                    <span className="flex items-center gap-1.5 text-green-600 font-semibold text-sm bg-green-50 px-3 py-2 rounded-lg">
                      <CheckCircleIcon className="w-5 h-5" /> Asistencia Confirmada
                    </span>
                    <button
                      onClick={() => handleCancelar(proxima.id)}
                      disabled={!!actionLoading[proxima.id]}
                      className="flex items-center gap-2 border border-red-200 text-red-500 hover:bg-red-50 px-4 py-2 rounded-lg text-sm transition disabled:opacity-50"
                    >
                      <XCircleIcon className="w-5 h-5" />
                      {actionLoading[proxima.id] === 'cancelar' ? 'Cancelando...' : 'Cancelar'}
                    </button>
                  </>
                )}
              </div>
            </div>
          ) : (
            <p className="text-gray-400 text-sm italic">No tienes sesiones programadas próximamente.</p>
          )}
        </Card>

        <Card title="Mi Progreso" borderColor="#22c55e">
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-5xl font-bold text-gray-900">{sesionesRealizadas}</p>
              <p className="text-xs text-gray-500 uppercase tracking-wider mt-1">Sesiones Completadas</p>
            </div>
            <ProgressBar value={porcentaje} />
            <p className="text-xs text-center text-gray-400">{porcentaje}% completado · Total: {totalSesiones}</p>
          </div>
        </Card>
      </div>

      {/* Grafica + Calendario */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <Card title="Sesiones por mes" className="lg:col-span-3">
          <p className="text-xs text-gray-400 -mt-3 mb-4">Últimos 6 meses</p>
          {sesionesPorMes.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-44 text-gray-400 text-sm gap-2">
              <CalendarDaysIcon className="w-10 h-10 text-gray-300" />
              Sin sesiones registradas
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={sesionesPorMes} barSize={32}>
                <XAxis dataKey="mes" tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomBarTooltip />} cursor={{ fill: '#f3f4f6' }} />
                <Bar dataKey="sesiones" radius={[6, 6, 0, 0]}>
                  {sesionesPorMes.map((_, i) => (
                    <Cell key={i} fill="#f97316" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card title="Calendario de Sesiones" borderColor="#a855f7" className="lg:col-span-2">
          <CalendarioSesiones sesiones={sesiones} />
        </Card>
      </div>

      {/* Historial reciente */}
      <Card title="Historial Reciente">
        <p className="text-xs text-gray-400 -mt-3 mb-4">Últimas sesiones registradas</p>
        {ultimas.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-gray-400 text-sm gap-2">
            <CalendarDaysIcon className="w-10 h-10 text-gray-300" />
            No hay sesiones registradas aún
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {ultimas.map((s) => (
              <li key={s.id} className="flex items-center justify-between py-3 gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center flex-shrink-0">
                    {s.estado === 'realizada' ? (
                      <CheckCircleIcon className="w-5 h-5 text-green-500" />
                    ) : s.estado === 'cancelada' ? (
                      <XCircleIcon className="w-5 h-5 text-red-400" />
                    ) : (
                      <ClockIcon className="w-5 h-5 text-orange-400" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{s.tema}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(s.fecha).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })} · {s.tutor?.nombre_completo}
                    </p>
                  </div>
                </div>
                <Badge variant={estadoBadge[s.estado] || 'default'}>{s.estado}</Badge>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}