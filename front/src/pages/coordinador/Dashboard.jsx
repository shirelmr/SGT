import {
  UsersIcon,
  AcademicCapIcon,
  CalendarDaysIcon,
  DocumentTextIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import Card from '../../components/ui/Card';
import Spinner from '../../components/ui/Spinner';
import Badge from '../../components/ui/Badge';
import { useCoordinadorDashboard } from '../../hooks/useCoordinadorDashboard';
import { useAuth } from '../../hooks/useAuth';

const statCards = [
  { key: 'tutoresActivos', label: 'Tutores Activos', icon: UsersIcon, color: '#f97316', bg: '#fff7ed' },
  { key: 'beneficiariosInscritos', label: 'Beneficiarios', icon: AcademicCapIcon, color: '#22c55e', bg: '#f0fdf4' },
  { key: 'sesionesMes', label: 'Sesiones este mes', icon: CalendarDaysIcon, color: '#3b82f6', bg: '#eff6ff' },
  { key: 'bitacorasPendientes', label: 'Bitácoras pendientes', icon: DocumentTextIcon, color: '#f59e0b', bg: '#fffbeb' },
];

const ESTADO_SESION = {
  programada: { label: 'Programada', variant: 'info' },
  realizada: { label: 'Realizada', variant: 'success' },
  cancelada: { label: 'Cancelada', variant: 'danger' },
};

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Buenos días';
  if (h < 18) return 'Buenas tardes';
  return 'Buenas noches';
}

function todayLabel() {
  return new Date().toLocaleDateString('es-MX', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatFecha(dateStr) {
  return new Date(dateStr).toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

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

export default function CoordinadorDashboard() {
  const { loading, stats } = useCoordinadorDashboard();
  const { user } = useAuth();

  const firstName = user?.nombre_completo?.split(' ')[0] ?? 'Coordinador';
  const totalBitacoras = stats?.totalBitacoras ?? 0;

  return (
    <div className="space-y-6">
      {/* Greeting header */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-7 py-5 flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-400 font-medium capitalize">{todayLabel()}</p>
          <h1 className="font-sora text-2xl font-bold text-gray-900 mt-0.5">
            {greeting()}, {firstName}
          </h1>
          <p className="text-gray-400 text-sm mt-0.5">Aquí tienes el resumen del sistema Talk!</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Spinner size="lg" />
        </div>
      ) : (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {statCards.map(({ key, label, icon: Icon, color, bg }) => (
              <div
                key={key}
                className="bg-white rounded-2xl shadow-sm p-5 flex items-center gap-4 border border-gray-100"
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: bg }}>
                  <Icon className="w-6 h-6" style={{ color }} />
                </div>
                <div>
                  <p className="text-gray-500 text-xs">{label}</p>
                  <p className="font-sora text-2xl font-bold text-gray-900">{stats?.[key] ?? 0}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Charts row */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            {/* Bar chart - sesiones por mes */}
            <Card title="Sesiones por mes" className="lg:col-span-3">
              <p className="text-xs text-gray-400 -mt-3 mb-4">Últimos 6 meses</p>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={stats?.sesionesporMes ?? []} barSize={32}>
                  <XAxis dataKey="mes" tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomBarTooltip />} cursor={{ fill: '#f3f4f6' }} />
                  <Bar dataKey="sesiones" fill="#ee7e4c" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            {/* Donut chart - bitacoras por estado */}
            <Card title="Estado de bitácoras" className="lg:col-span-2">
              <p className="text-xs text-gray-400 -mt-3 mb-2">
                {totalBitacoras} en total
              </p>
              {totalBitacoras === 0 ? (
                <div className="flex flex-col items-center justify-center h-44 text-gray-400 text-sm gap-2">
                  <DocumentTextIcon className="w-10 h-10 text-gray-300" />
                  Sin bitácoras registradas
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={stats?.bitacorasPorEstado ?? []}
                      cx="50%"
                      cy="50%"
                      innerRadius={52}
                      outerRadius={76}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {(stats?.bitacorasPorEstado ?? []).map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomPieTooltip />} />
                    <Legend
                      iconType="circle"
                      iconSize={8}
                      formatter={(value) => <span className="text-xs text-gray-600">{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </Card>
          </div>

          {/* Recent activity */}
          <Card title="Actividad reciente">
            <p className="text-xs text-gray-400 -mt-3 mb-4">Últimas sesiones registradas</p>
            {!stats?.actividadReciente?.length ? (
              <div className="flex flex-col items-center justify-center py-10 text-gray-400 text-sm gap-2">
                <CalendarDaysIcon className="w-10 h-10 text-gray-300" />
                No hay sesiones registradas aún
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {stats.actividadReciente.map((s) => {
                  const estado = ESTADO_SESION[s.estado] ?? { label: s.estado, variant: 'default' };
                  return (
                    <li key={s.id} className="flex items-center justify-between py-3 gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center flex-shrink-0">
                          {s.estado === 'realizada' ? (
                            <CheckCircleIcon className="w-5 h-5 text-green-500" />
                          ) : s.estado === 'cancelada' ? (
                            <XCircleIcon className="w-5 h-5 text-red-400" />
                          ) : (
                            <ClockIcon className="w-5 h-5 text-[#ee7e4c]" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">{s.tema || 'Sin tema'}</p>
                          <p className="text-xs text-gray-400 truncate">
                            {s.tutor?.nombre_completo ?? 'Tutor'} →{' '}
                            {s.beneficiario?.nombre_completo ?? 'Beneficiario'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <Badge variant={estado.variant}>{estado.label}</Badge>
                        <span className="text-xs text-gray-400 hidden sm:block">{formatFecha(s.fecha)}</span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
