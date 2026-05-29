import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  DocumentTextIcon,
  CheckCircleIcon,
  ClockIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { getBitacoras } from '../../api/bitacoras';
import { useAuth } from '../../hooks/useAuth';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';

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

const CustomPieTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 px-4 py-2 text-sm">
      <p className="font-semibold text-gray-700">{payload[0].name}</p>
      <p className="font-bold" style={{ color: payload[0].payload.color }}>
        {payload[0].value} bitácoras
      </p>
    </div>
  );
};

export default function RevisorDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ total: 0, revisadas: 0, pendientes: 0 });
  const [chartData, setChartData] = useState([]);
  const [recentPendientes, setRecentPendientes] = useState([]);
  const [loading, setLoading] = useState(true);

  const firstName = user?.nombre_completo?.split(' ')[0] ?? 'Revisor';

  useEffect(() => {
    getBitacoras()
      .then((r) => {
        const all = r.data || [];

        const pendientesList = all.filter((b) => !b.estado || b.estado === 'pendiente');
        const aprobadas = all.filter((b) => b.estado === 'aprobado').length;
        const aprobadasSinHoras = all.filter((b) => b.estado === 'aprobado_sin_horas').length;
        const rechazadas = all.filter((b) => b.estado === 'no_aprobada').length;
        const pendientes = pendientesList.length;
        const revisadas = aprobadas + aprobadasSinHoras + rechazadas;

        setStats({ total: all.length, revisadas, pendientes });
        setRecentPendientes(pendientesList.slice(0, 5)); 

        const data = [
          { name: 'Aprobadas', value: aprobadas, color: '#22c55e' }, // Verde success
          { name: 'Aprob. sin horas', value: aprobadasSinHoras, color: '#f97316' }, // Naranja
          { name: 'No Aprobadas', value: rechazadas, color: '#ef4444' }, // Rojo danger
          { name: 'Pendientes', value: pendientes, color: '#f59e0b' } // Amarillo warning
        ].filter(d => d.value > 0);

        setChartData(data);
      })
      .catch(() => toast.error('Error al cargar bitácoras'))
      .finally(() => setLoading(false));
  }, []);

  const statCards = [
    { label: 'Total Asignadas', value: stats.total, icon: DocumentTextIcon, color: '#3b82f6', bg: '#eff6ff' },
    { label: 'Revisadas', value: stats.revisadas, icon: CheckCircleIcon, color: '#22c55e', bg: '#f0fdf4' },
    { label: 'Pendientes', value: stats.pendientes, icon: ClockIcon, color: '#f59e0b', bg: '#fffbeb' },
  ];

  return (
    <div className="space-y-6">
      
      {/* 1. GREETING HEADER */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-7 py-5 flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-400 font-medium capitalize">{todayLabel()}</p>
          <h1 className="font-sora text-2xl font-bold text-gray-900 mt-0.5">
            {greeting()}, {firstName}
          </h1>
          <p className="text-gray-400 text-sm mt-0.5">Aquí tienes tu resumen de revisiones asignadas.</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Spinner size="lg" />
        </div>
      ) : (
        <>
          {/* 2. STAT CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {statCards.map((c) => {
              const Icon = c.icon;
              return (
                <div key={c.label} className="bg-white rounded-2xl shadow-sm p-5 flex items-center gap-4 border border-gray-100">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: c.bg }}>
                    <Icon className="w-6 h-6" style={{ color: c.color }} />
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs">{c.label}</p>
                    <p className="font-sora text-2xl font-bold text-gray-900">{c.value}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 3. CHARTS ROW */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            <Card title="Revisión Inmediata" className="lg:col-span-2">
              <p className="text-xs text-gray-400 -mt-3 mb-4">Bitácoras pendientes de revisión</p>
              
              {recentPendientes.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 gap-2">
                  <CheckCircleIcon className="w-10 h-10 text-green-400" />
                  <p className="text-gray-400 text-sm">Estás al día con tus revisiones.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <ul className="divide-y divide-gray-100">
                    {recentPendientes.map((b) => (
                      <li key={b.id} className="py-3 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center flex-shrink-0">
                            <ClockIcon className="w-5 h-5 text-orange-400" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-800 truncate">
                              {b.sesion?.tema || 'Tema no registrado'}
                            </p>
                            <p className="text-xs text-gray-400 truncate">
                              Tutor: {b.sesion?.tutor?.nombre_completo || '—'} • Alumno: {b.sesion?.beneficiario?.nombre_completo || '—'}
                            </p>
                          </div>
                        </div>
                        <Link
                          to={`/revisor/bitacoras/${b.sesion?.id_sesion || b.id_sesion}`}
                          className="px-4 py-1.5 bg-orange-50 text-[#ee7e4c] hover:bg-orange-100 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap"
                        >
                          Revisar
                        </Link>
                      </li>
                    ))}
                  </ul>
                  <div className="pt-2 flex justify-end">
                    <Link to="/revisor/bitacoras">
                      <Button variant="secondary" className="flex items-center gap-2 text-sm py-1.5">
                        Ver todas <ArrowRightIcon className="w-4 h-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              )}
            </Card>

            <Card title="Distribución de Bitácoras">
              <p className="text-xs text-gray-400 -mt-3 mb-2">{stats.total} asignadas</p>
              
              {chartData.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-44 text-gray-400 text-sm gap-2">
                  <DocumentTextIcon className="w-10 h-10 text-gray-300" />
                  Sin datos suficientes
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={52}
                      outerRadius={76}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {chartData.map((entry) => (
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
        </>
      )}
    </div>
  );
}