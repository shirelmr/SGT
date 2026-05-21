import { useState } from 'react';
import { CalendarDaysIcon, LinkIcon, CheckCircleIcon, XCircleIcon, ClockIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';
import { useBeneficiarioDashboard } from '../../hooks/useBeneficiarioDashboard';
import { confirmarAsistencia, cancelarAsistencia } from '../../api/asistencias';
import PageHeader from '../../components/shared/PageHeader';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Spinner from '../../components/ui/Spinner';
import ProgressBar from '../../components/ui/ProgressBar';

const estadoBadge = {
  programada: 'info',
  realizada: 'success',
  cancelada: 'danger',
};

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
        <button onClick={() => setMes(new Date(year, month - 1, 1))} className="text-gray-400 hover:text-gray-600 px-2">‹</button>
        <span className="text-sm font-semibold text-gray-700 capitalize">{nombreMes}</span>
        <button onClick={() => setMes(new Date(year, month + 1, 1))} className="text-gray-400 hover:text-gray-600 px-2">›</button>
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
            <span key={i} className={`w-7 h-7 mx-auto flex items-center justify-center rounded-full ${esHoy ? 'bg-orange-500 text-white font-bold' : tieneSesion ? 'bg-orange-100 text-orange-600 font-semibold' : 'text-gray-600'}`}>
              {dia}
            </span>
          );
        })}
      </div>
    </div>
  );
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
    } catch (err) {
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
    } catch (err) {
      toast.error('Error al cancelar');
    } finally {
      setActionLoading((p) => ({ ...p, [sesionId]: null }));
    }
  }

  if (loading) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>;

  const sesionesRealizadas = sesiones.filter(s => s.estado === 'realizada').length;
  const totalSesiones = sesiones.length;
  const porcentaje = totalSesiones > 0 ? Math.round((sesionesRealizadas / totalSesiones) * 100) : 0;

  return (
    <div className="pb-8">
      <PageHeader 
        title={`¡Hola, ${user?.nombre_completo?.split(' ')[0]}!`} 
        subtitle="Bienvenido a tu tablero de control" 
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card title="Próxima Sesión" borderColor="#f97316" className="lg:col-span-2">
          {proxima ? (
            <div className="flex flex-col gap-2 text-sm text-gray-600">
                {/* Fecha */}
                <div className="flex items-center gap-2">
                <CalendarDaysIcon className="w-5 h-5 text-orange-500 flex-shrink-0" />
                <span className="font-medium capitalize">
                  {new Date(proxima.fecha).toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}
                </span>
              </div>

                {/* Hora */}
                <div className="flex items-center gap-2">
                  <ClockIcon className="w-5 h-5 text-orange-500 flex-shrink-0" />
                  <span className="font-medium">
                    {proxima.hora_inicio} hrs
                  </span>
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
                    El enlace de acceso aparecerá aquí una vez que confirmes tu asistencia.
                  </p>
                </div>
              )}

              <div className="flex flex-wrap gap-3 pt-2">
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
                      {actionLoading[proxima.id] === 'cancelar' ? 'Cancelar' : 'Cancelar'}
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
              <p className="text-4xl font-bold text-gray-900">{sesionesRealizadas}</p>
              <p className="text-xs text-gray-500 uppercase tracking-wider">Sesiones Completadas</p>
            </div>
            <ProgressBar value={porcentaje} />
            <p className="text-xs text-center text-gray-400">{porcentaje}% completado • Total: {totalSesiones}</p>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card title="Calendario de Sesiones" borderColor="#a855f7">
          <CalendarioSesiones sesiones={sesiones} />
        </Card>

        <Card title="Historial Reciente" className="lg:col-span-2">
          {ultimas.length === 0 ? (
            <p className="text-sm text-gray-400 italic">Aún no hay historial de sesiones.</p>
          ) : (
            <div className="overflow-hidden">
              <ul className="divide-y divide-gray-100">
                {ultimas.map((s) => (
                  <li key={s.id} className="py-3 flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{s.tema}</p>
                      <p className="text-xs text-gray-500">{new Date(s.fecha).toLocaleDateString()} • {s.tutor?.nombre_completo}</p>
                    </div>
                    <Badge variant={estadoBadge[s.estado] || 'default'}>{s.estado}</Badge>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}