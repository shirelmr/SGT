import { Link } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useTutorDashboard } from '../../hooks/useTutorDashboard';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Spinner from '../../components/ui/Spinner';
import {
  CalendarDaysIcon,
  ClockIcon,
  LinkIcon,
  ChatBubbleLeftIcon,
  CheckCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ExclamationCircleIcon,
  PencilSquareIcon,
  DocumentTextIcon,
  AcademicCapIcon,
} from '@heroicons/react/24/outline';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';

// ─── Mapeos ───────────────────────────────────────────────────────────────────
const estadoBadge = {
  programada: 'info',
  realizada:  'success',
  cancelada:  'danger',
};
const estadoBitacoraBadge = {
  pendiente:          'warning',
  no_aprobada:        'danger',
  aprobado:           'success',
  aprobado_sin_horas: 'orange',
};
const estadoBitacoraLabel = {
  pendiente:          'Pendiente de revisión',
  no_aprobada:        'No aprobada',
  aprobado:           'Aprobada',
  aprobado_sin_horas: 'Aprobada sin horas',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
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

// ─── Tooltips ─────────────────────────────────────────────────────────────────
const CustomBarTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 px-4 py-2 text-sm">
      <p className="font-semibold text-gray-700">{label}</p>
      <p className="text-[#ee7e4c] font-bold">{payload[0].value} sesiones</p>
    </div>
  );
};
const CustomPieTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 px-4 py-2 text-sm">
      <p className="font-semibold text-gray-700">{payload[0].name}</p>
      <p className="font-bold" style={{ color: payload[0].payload.color }}>{payload[0].value}</p>
    </div>
  );
};

// ─── Calendario ───────────────────────────────────────────────────────────────
const DIAS  = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'];
const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

function CalendarioSesiones({ sesiones }) {
  const [ref, setRef] = useState(new Date());
  const year  = ref.getFullYear();
  const month = ref.getMonth();

  const sessionDays = new Set(
    sesiones.map((s) => {
      const d = new Date(s.fecha);
      return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    })
  );

  const primerDia = new Date(year, month, 1).getDay();
  const offset    = primerDia === 0 ? 6 : primerDia - 1;
  const diasEnMes = new Date(year, month + 1, 0).getDate();
  const hoy       = new Date();
  const celdas    = Array(offset).fill(null).concat(Array.from({ length: diasEnMes }, (_, i) => i + 1));

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <button onClick={() => setRef(new Date(year, month - 1, 1))} className="p-1 rounded hover:bg-gray-100 transition-colors">
          <ChevronLeftIcon  className="w-4 h-4 text-gray-500" />
        </button>
        <span className="text-sm font-semibold text-gray-700">{MESES[month]} {year}</span>
        <button onClick={() => setRef(new Date(year, month + 1, 1))} className="p-1 rounded hover:bg-gray-100 transition-colors">
          <ChevronRightIcon className="w-4 h-4 text-gray-500" />
        </button>
      </div>
      <div className="grid grid-cols-7 text-center mb-1">
        {DIAS.map((d) => <div key={d} className="text-[10px] font-medium text-gray-400 py-1">{d}</div>)}
      </div>
      <div className="grid grid-cols-7 text-center text-xs gap-y-1">
        {celdas.map((dia, i) => {
          if (!dia) return <span key={`e-${i}`} />;
          const key = `${year}-${month}-${dia}`;
          const tieneSesion = sessionDays.has(key);
          const esHoy = dia === hoy.getDate() && month === hoy.getMonth() && year === hoy.getFullYear();
          return (
            <span key={key} className={`w-7 h-7 mx-auto flex items-center justify-center rounded-full
              ${esHoy ? 'bg-orange-500 text-white font-bold' : tieneSesion ? 'bg-orange-100 text-orange-600 font-semibold' : 'text-gray-600'}`}>
              {dia}
            </span>
          );
        })}
      </div>
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
export default function TutorDashboard() {
  const { user } = useAuth();
  const {
    loading, horas, proxima, sesiones, ultimasTres,
    bitacorasPendientes, asistencia, confirmando, confirmar,
    sesionesporMes, bitacorasPorEstado, sesionesRealizadas, totalBitacoras,
  } = useTutorDashboard();

  const firstName       = user?.nombre_completo?.split(' ')[0] ?? 'Tutor';
  const horasImpartidas  = Number(horas?.horas_impartidas  ?? 0);
  const horasExtra       = Number(horas?.horas_extra        ?? 0);
  const horasEsperadas   = Number(horas?.periodo?.horas_esperadas ?? 0); // 50 hrs requeridas de tutoría
  const horasMax         = Number(horas?.periodo?.horas_max       ?? 0); // 180 hrs servicio social
  const porcentaje       = Number(horas?.porcentaje_acred   ?? 0);
  const horasTotales     = horasImpartidas + horasExtra;

  // Donut 1 — impartidas vs esperadas
  const donutEsperadas = horasEsperadas > 0
    ? [
        { name: 'Impartidas', value: Math.min(horasImpartidas, horasEsperadas), color: '#ee7e4c' },
        { name: 'Restantes',  value: Math.max(0, horasEsperadas - horasImpartidas), color: '#e5e7eb' },
      ]
    : [{ name: '—', value: 1, color: '#e5e7eb' }];

  // Donut 2 — totales (impartidas + extra) vs horas_max (servicio social)
  const donutMax = horasMax > 0
    ? [
        { name: 'Acreditadas', value: Math.min(horasTotales, horasMax), color: '#3b82f6' },
        { name: 'Restantes',   value: Math.max(0, horasMax - horasTotales), color: '#e5e7eb' },
      ]
    : [{ name: '—', value: 1, color: '#e5e7eb' }];

  const statCards = [
    { label: 'Sesiones realizadas',  value: sesionesRealizadas,          icon: CalendarDaysIcon,  color: '#22c55e', bg: '#f0fdf4' },
    { label: 'Horas impartidas',     value: horasImpartidas,             icon: ClockIcon,          color: '#f97316', bg: '#fff7ed' },
    { label: 'Bitácoras pendientes', value: bitacorasPendientes.length,  icon: DocumentTextIcon,   color: '#ef4444', bg: '#fef2f2' },
    { label: '% Acreditado',         value: `${porcentaje}%`,            icon: AcademicCapIcon,    color: '#3b82f6', bg: '#eff6ff' },
  ];

  if (loading) {
    return <div className="flex items-center justify-center py-16"><Spinner size="lg" /></div>;
  }

  return (
    <div className="space-y-6">

      {/* 1 ── Widget de saludo ──────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-7 py-5">
        <p className="text-xs text-gray-400 font-medium capitalize">{todayLabel()}</p>
        <h1 className="font-sora text-2xl font-bold text-gray-900 mt-0.5">
          {greeting()}, {firstName}
        </h1>
        <p className="text-gray-400 text-sm mt-0.5">Aquí tienes el resumen de tu actividad</p>
      </div>

      {/* 2 ── 4 KPI cards ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
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

      {/* 3 ── Próxima sesión (50%) + Horas con 2 donuts (50%) ─────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Próxima sesión — col-1 */}
        <Card title="Próxima Sesión" borderColor="#f97316">
          {proxima ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <CalendarDaysIcon className="w-4 h-4 text-orange-500 flex-shrink-0" />
                <span>
                  {new Date(proxima.fecha.split('T')[0] + 'T12:00:00').toLocaleDateString('es-MX', {
                    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
                  })}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <ClockIcon className="w-4 h-4 text-orange-500 flex-shrink-0" />
                <span>{proxima.hora_inicio} • {proxima.duracion_hrs} hora(s)</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className="font-medium text-gray-800 flex-shrink-0">Tema:</span>
                <span className="truncate">{proxima.tema}</span>
              </div>
              {proxima.link_sesion && (
                asistencia?.confirma_tutor ? (
                  <a href={proxima.link_sesion} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-orange-500 hover:text-orange-600 text-sm font-medium">
                    <LinkIcon className="w-4 h-4" />
                    Unirse a la sesión
                  </a>
                ) : (
                  <button onClick={confirmar} disabled={confirmando}
                    className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white text-sm font-medium px-3 py-1.5 rounded-lg transition-colors">
                    <CheckCircleIcon className="w-4 h-4" />
                    {confirmando ? 'Confirmando…' : 'Confirmar asistencia'}
                  </button>
                )
              )}
            </div>
          ) : (
            <p className="text-gray-400 text-sm">No hay sesiones programadas próximamente.</p>
          )}
        </Card>

        {/* Horas — col-1, dos donuts */}
        <Card title="Horas Periodo Actual" borderColor="#22c55e">
          <div className="flex flex-col sm:flex-row items-center justify-around gap-3">

            {/* Donut 1 — impartidas vs esperadas */}
            <div className="flex flex-col items-center gap-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Tutoría</p>
              <div className="relative">
                <PieChart width={148} height={148}>
                  <Pie
                    data={donutEsperadas}
                    cx="50%" cy="50%"
                    innerRadius={48} outerRadius={68}
                    startAngle={90} endAngle={-270}
                    paddingAngle={horasEsperadas > 0 && horasImpartidas > 0 ? 3 : 0}
                    dataKey="value" strokeWidth={0}
                  >
                    {donutEsperadas.map((e) => <Cell key={e.name} fill={e.color} />)}
                  </Pie>
                </PieChart>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="font-sora text-xl font-bold text-gray-900">{horasImpartidas}</span>
                  <span className="text-[11px] text-gray-400">{horasEsperadas > 0 ? `de ${horasEsperadas}` : '—'}</span>
                </div>
              </div>
              <div className="flex gap-3 text-xs text-gray-500">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#ee7e4c] inline-block" />Impartidas</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-gray-200 inline-block" />Restantes</span>
              </div>
              {horasEsperadas > 0 && (
                <p className="text-xs font-semibold text-orange-500">{porcentaje}% completado</p>
              )}
            </div>

            {/* Divisor vertical */}
            <div className="hidden sm:block w-px h-36 bg-gray-100" />

            {/* Donut 2 — totales vs horas_max (servicio social) */}
            <div className="flex flex-col items-center gap-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Servicio social</p>
              <div className="relative">
                <PieChart width={148} height={148}>
                  <Pie
                    data={donutMax}
                    cx="50%" cy="50%"
                    innerRadius={48} outerRadius={68}
                    startAngle={90} endAngle={-270}
                    paddingAngle={horasMax > 0 && horasTotales > 0 ? 3 : 0}
                    dataKey="value" strokeWidth={0}
                  >
                    {donutMax.map((e) => <Cell key={e.name} fill={e.color} />)}
                  </Pie>
                </PieChart>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="font-sora text-xl font-bold text-gray-900">{horasTotales}</span>
                  <span className="text-[11px] text-gray-400">{horasMax > 0 ? `de ${horasMax}` : '—'}</span>
                </div>
              </div>
              <div className="flex gap-3 text-xs text-gray-500">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />Acreditadas</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-gray-200 inline-block" />Restantes</span>
              </div>
              {horasMax > 0 && (
                <p className="text-xs font-semibold text-blue-500">
                  {Math.min(100, Math.round((horasTotales / horasMax) * 100))}% del servicio
                </p>
              )}
            </div>

          </div>
        </Card>
      </div>

      {/* 4 ── Calendario + Bitácoras pendientes ────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card title="Calendario de Sesiones" borderColor="#a855f7" className="lg:col-span-2">
          <CalendarioSesiones sesiones={sesiones} />
        </Card>

        <Card title="Bitácoras Pendientes" borderColor="#ef4444">
          {bitacorasPendientes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-4 gap-2">
              <CheckCircleIcon className="w-8 h-8 text-green-400" />
              <p className="text-sm text-gray-500 text-center">¡Todas al día!</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {bitacorasPendientes.map((s) => (
                <li key={s.id} className="flex items-start gap-2 p-2 rounded-lg bg-red-50 border border-red-100">
                  <ExclamationCircleIcon className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-800 truncate">{s.tema}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(s.fecha.split('T')[0] + 'T12:00:00').toLocaleDateString('es-MX')}
                    </p>
                  </div>
                  <Link to={`/tutor/sesiones/${s.id}/bitacora`} className="shrink-0 text-orange-500 hover:text-orange-600" title="Registrar bitácora">
                    <PencilSquareIcon className="w-4 h-4" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {/* 5 ── Gráficas ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Barras — sesiones por mes */}
        <Card title="Sesiones por mes" className="lg:col-span-3">
          <p className="text-xs text-gray-400 -mt-3 mb-4">Últimos 6 meses</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={sesionesporMes} barSize={32}>
              <XAxis dataKey="mes" tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomBarTooltip />} cursor={{ fill: '#f3f4f6' }} />
              <Bar dataKey="sesiones" fill="#ee7e4c" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Donut — estado de bitácoras */}
        <Card title="Estado de bitácoras" className="lg:col-span-2">
          <p className="text-xs text-gray-400 -mt-3 mb-2">{totalBitacoras} en total (periodo activo)</p>
          {totalBitacoras === 0 ? (
            <div className="flex flex-col items-center justify-center h-44 text-gray-400 text-sm gap-2">
              <DocumentTextIcon className="w-10 h-10 text-gray-300" />
              Sin bitácoras registradas
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={bitacorasPorEstado}
                  cx="50%" cy="50%"
                  innerRadius={52} outerRadius={76}
                  paddingAngle={3} dataKey="value"
                >
                  {bitacorasPorEstado.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomPieTooltip />} />
                <Legend iconType="circle" iconSize={8}
                  formatter={(v) => <span className="text-xs text-gray-600">{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      {/* 6 ── Últimas sesiones ──────────────────────────────────────────────── */}
      <Card title="Últimas Sesiones">
        <p className="text-xs text-gray-400 -mt-3 mb-4">Sesiones más recientes registradas</p>
        {ultimasTres.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-gray-400 text-sm gap-2">
            <CalendarDaysIcon className="w-10 h-10 text-gray-300" />
            No hay sesiones registradas aún
          </div>
        ) : (
          <ul className="divide-y divide-gray-50">
            {ultimasTres.map((s) => (
              <li key={s.id} className="py-3 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{s.tema}</p>
                  <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                    <CalendarDaysIcon className="w-3 h-3 flex-shrink-0" />
                    {new Date(s.fecha.split('T')[0] + 'T12:00:00').toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' })}
                    {' • '}{s.hora_inicio}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0 flex-wrap justify-end">
                  {s.bitacora_tiene_comentarios_nuevos && (
                    <ChatBubbleLeftIcon className="w-4 h-4 text-red-500" />
                  )}
                  <span className="text-xs text-gray-400">Sesión:</span>
                  <Badge variant={estadoBadge[s.estado] || 'default'}>{s.estado}</Badge>
                  {s.bitacora && (
                    <>
                      <span className="text-gray-200 select-none">|</span>
                      <span className="text-xs text-gray-400">Bitácora:</span>
                      <Badge variant={estadoBitacoraBadge[s.bitacora.estado] || 'default'}>
                        {estadoBitacoraLabel[s.bitacora.estado] || s.bitacora.estado}
                      </Badge>
                    </>
                  )}
                  {s.bitacora?.estado === 'aprobado' && (
                    <CheckCircleIcon className="w-4 h-4 text-green-500" />
                  )}
                  <Link to={`/tutor/sesiones/${s.id}/bitacora`} className="text-xs text-orange-500 hover:underline font-medium ml-1">
                    Ver →
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
