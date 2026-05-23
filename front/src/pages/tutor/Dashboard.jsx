import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useTutorDashboard } from '../../hooks/useTutorDashboard';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Spinner from '../../components/ui/Spinner';
import ProgressBar from '../../components/ui/ProgressBar';
import PageHeader from '../../components/shared/PageHeader';
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
} from '@heroicons/react/24/outline';

const estadoBadge = {
  programada: 'info',
  realizada: 'success',
  cancelada: 'danger',
};

const estadoBitacoraBadge = {
  pendiente: 'warning',
  no_aprobada: 'danger',
  aprobado: 'success',
  aprobado_sin_horas: 'orange',
};

const estadoBitacoraLabel = {
  pendiente: 'Pendiente de revisión',
  no_aprobada: 'No aprobada',
  aprobado: 'Aprobada',
  aprobado_sin_horas: 'Aprobada sin horas',
};

const DIAS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

function CalendarioSesiones({ sesiones }) {
  const [ref, setRef] = useState(new Date());
  const year = ref.getFullYear();
  const month = ref.getMonth();

  const sessionDays = new Set(
    sesiones.map((s) => {
      const d = new Date(s.fecha);
      return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    })
  );

  const primerDia = new Date(year, month, 1).getDay();
  const offset = primerDia === 0 ? 6 : primerDia - 1;
  const diasEnMes = new Date(year, month + 1, 0).getDate();
  const hoy = new Date();

  const celdas = Array(offset).fill(null).concat(
    Array.from({ length: diasEnMes }, (_, i) => i + 1)
  );

  const prevMonth = () => setRef(new Date(year, month - 1, 1));
  const nextMonth = () => setRef(new Date(year, month + 1, 1));

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <button onClick={prevMonth} className="p-1 rounded hover:bg-gray-100 transition-colors">
          <ChevronLeftIcon className="w-4 h-4 text-gray-500" />
        </button>
        <span className="text-sm font-semibold text-gray-700">
          {MESES[month]} {year}
        </span>
        <button onClick={nextMonth} className="p-1 rounded hover:bg-gray-100 transition-colors">
          <ChevronRightIcon className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      <div className="grid grid-cols-7 text-center text-xs text-gray-400 mb-1">
        {DIAS.map((d) => (
          <div key={d} className="text-[10px] font-medium text-gray-400 py-1">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 text-center text-xs gap-y-1">
        {celdas.map((dia, i) => {
          if (!dia) return <span key={`e-${i}`} />;
          const key = `${year}-${month}-${dia}`;
          const tieneSesion = sessionDays.has(key);
          const esHoy =
            dia === hoy.getDate() &&
            month === hoy.getMonth() &&
            year === hoy.getFullYear();

          return (
            <span
              key={key}
              className={`w-7 h-7 mx-auto flex items-center justify-center rounded-full
                ${esHoy ? 'bg-orange-500 text-white font-bold' : tieneSesion ? 'bg-orange-100 text-orange-600 font-semibold' : 'text-gray-600'}
              `}
            >
              {dia}
            </span>
          );
        })}
      </div>
    </div>
  );
}

export default function TutorDashboard() {
  const { user } = useAuth();
  const {
    loading, horas, proxima, sesiones, ultimasTres,
    bitacorasPendientes, asistencia, confirmando, confirmar,
  } = useTutorDashboard();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Spinner size="lg" />
      </div>
    );
  }

  const horasImpartidas = Number(horas?.horas_impartidas ?? 0);
  const horasMax = Number(horas?.periodo?.horas_max ?? 0);
  const porcentaje = Number(horas?.porcentaje_acred ?? 0);

  return (
    <div>
      <PageHeader
        title={`¡Hola, ${user?.nombre_completo?.split(' ')[0]}!`}
        subtitle="Aquí está el resumen de tu actividad"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        {/* Próxima sesión */}
        <Card title="Próxima Sesión" borderColor="#f97316" className="lg:col-span-2">
          {proxima ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <CalendarDaysIcon className="w-4 h-4 text-orange-500" />
                <span>
                  {new Date(proxima.fecha.split('T')[0] + 'T12:00:00').toLocaleDateString('es-MX', {
                    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
                  })}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <ClockIcon className="w-4 h-4 text-orange-500" />
                <span>{proxima.hora_inicio} • {proxima.duracion_hrs} hora(s)</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className="font-medium text-gray-800">Tema:</span>
                <span>{proxima.tema}</span>
              </div>
              {proxima.link_sesion && (
                asistencia?.confirma_tutor ? (
                  <a
                    href={proxima.link_sesion}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-orange-500 hover:text-orange-600 text-sm font-medium"
                  >
                    <LinkIcon className="w-4 h-4" />
                    Unirse a la sesión
                  </a>
                ) : (
                  <button
                    onClick={confirmar}
                    disabled={confirmando}
                    className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white text-sm font-medium px-3 py-1.5 rounded-lg transition-colors"
                  >
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

        {/* Horas periodo actual */}
        <Card title="Horas Periodo Actual" borderColor="#22c55e">
          <div className="flex flex-col gap-3">
            <div className="text-center">
              <p className="font-sora text-4xl font-bold text-gray-900">
                {horasImpartidas}
                {horasMax > 0 && (
                  <span className="text-xl font-normal text-gray-400"> / {horasMax}</span>
                )}
              </p>
              <p className="text-gray-500 text-sm mt-1">horas impartidas</p>
            </div>
            {horasMax > 0 && (
              <ProgressBar value={porcentaje} />
            )}
            {porcentaje > 0 && (
              <p className="text-center text-orange-500 font-semibold text-sm">
                {porcentaje}% acreditado
              </p>
            )}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        {/* Calendario de sesiones */}
        <Card title="Calendario de Sesiones" borderColor="#a855f7" className="lg:col-span-2">
          <CalendarioSesiones sesiones={sesiones} />
        </Card>

        {/* Bitácoras pendientes */}
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
                  <Link
                    to={`/tutor/sesiones/${s.id}/bitacora`}
                    className="shrink-0 text-orange-500 hover:text-orange-600"
                    title="Registrar bitácora"
                  >
                    <PencilSquareIcon className="w-4 h-4" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {/* Últimas sesiones */}
      <Card title="Últimas Sesiones">
        {ultimasTres.length === 0 ? (
          <p className="text-gray-400 text-sm">No hay sesiones registradas aún.</p>
        ) : (
          <ul className="divide-y divide-gray-50">
            {ultimasTres.map((s) => (
              <li key={s.id} className="py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-800">{s.tema}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(s.fecha.split('T')[0] + 'T12:00:00').toLocaleDateString('es-MX')} • {s.hora_inicio}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {s.bitacora_tiene_comentarios_nuevos && (
                    <ChatBubbleLeftIcon className="w-4 h-4 text-red-500" />
                  )}
                  <Badge variant={estadoBadge[s.estado] || 'default'}>{s.estado}</Badge>
                  {s.bitacora && (
                    <Badge variant={estadoBitacoraBadge[s.bitacora.estado] || 'default'}>
                      {estadoBitacoraLabel[s.bitacora.estado] || s.bitacora.estado}
                    </Badge>
                  )}
                  <Link
                    to={`/tutor/sesiones/${s.id}/bitacora`}
                    className="text-xs text-orange-500 hover:underline font-medium"
                  >
                    Ver bitácora
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
