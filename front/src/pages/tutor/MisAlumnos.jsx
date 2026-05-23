import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  ChevronDownIcon,
  ChevronUpIcon,
  AcademicCapIcon,
  CalendarDaysIcon,
  PhoneIcon,
  EnvelopeIcon,
} from '@heroicons/react/24/outline';
import { getMisBeneficiarios } from '../../api/tutor';
import PageHeader from '../../components/shared/PageHeader';
import ProgressBar from '../../components/ui/ProgressBar';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';

// ─── Avatar de iniciales ──────────────────────────────────────────────────────
const COLORES = [
  'bg-orange-100 text-orange-700',
  'bg-blue-100 text-blue-700',
  'bg-green-100 text-green-700',
  'bg-purple-100 text-purple-700',
  'bg-pink-100 text-pink-700',
  'bg-teal-100 text-teal-700',
];

function iniciales(nombre = '') {
  return nombre
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('');
}

function colorPorNombre(nombre = '') {
  let hash = 0;
  for (let i = 0; i < nombre.length; i++) hash = nombre.charCodeAt(i) + ((hash << 5) - hash);
  return COLORES[Math.abs(hash) % COLORES.length];
}

// ─── Helpers de fecha ─────────────────────────────────────────────────────────
function fmtFecha(fechaStr) {
  if (!fechaStr) return null;
  const [y, m, d] = fechaStr.split('T')[0].split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('es-MX', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

// ─── Fila de alumno (colapsable) ──────────────────────────────────────────────
function AlumnoRow({ alumno }) {
  const [open, setOpen] = useState(false);
  const color = colorPorNombre(alumno.nombre_completo);
  const ini = iniciales(alumno.nombre_completo);

  const tieneExamenes = alumno.examen_inicio !== null || alumno.examen_termino !== null;

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden transition-shadow hover:shadow-md">
      {/* ── Fila principal ── */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-4 p-4 text-left"
      >
        {/* Avatar */}
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0 ${color}`}>
          {ini}
        </div>

        {/* Info principal */}
        <div className="flex-1 min-w-0">
          <p className="font-sora font-semibold text-gray-800 text-sm truncate">
            {alumno.nombre_completo}
          </p>
          <p className="text-xs text-gray-400 mt-0.5 truncate">
            {[alumno.escuela, alumno.grado_escolar].filter(Boolean).join(' · ') || 'Sin datos de escuela'}
          </p>
        </div>

        {/* Mini stats */}
        <div className="hidden sm:flex items-center gap-4 text-xs text-gray-500 flex-shrink-0">
          <span className="flex items-center gap-1">
            <CalendarDaysIcon className="w-3.5 h-3.5" />
            <span><strong className="text-gray-700">{alumno.sesiones.realizadas}</strong>/{alumno.sesiones.total} sesiones</span>
          </span>
          {tieneExamenes && (
            <span className="flex items-center gap-1">
              <AcademicCapIcon className="w-3.5 h-3.5" />
              <span>
                {alumno.examen_inicio !== null ? `${Number(alumno.examen_inicio)}%` : '—'}
                {' → '}
                {alumno.examen_termino !== null ? `${Number(alumno.examen_termino)}%` : '—'}
              </span>
            </span>
          )}
        </div>

        {/* Chevron */}
        <div className="flex-shrink-0 text-gray-400 ml-2">
          {open ? <ChevronUpIcon className="w-4 h-4" /> : <ChevronDownIcon className="w-4 h-4" />}
        </div>
      </button>

      {/* ── Panel expandido ── */}
      {open && (
        <div className="border-t border-gray-100 px-4 pb-4 pt-3 grid grid-cols-1 sm:grid-cols-2 gap-4">

          {/* Sesiones */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Sesiones</p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Total', value: alumno.sesiones.total },
                { label: 'Realizadas', value: alumno.sesiones.realizadas },
                { label: 'Pendientes', value: alumno.sesiones.total - alumno.sesiones.realizadas },
              ].map(({ label, value }) => (
                <div key={label} className="bg-gray-50 rounded-xl p-2.5 text-center">
                  <p className="font-sora font-bold text-gray-800 text-lg">{value}</p>
                  <p className="text-xs text-gray-400">{label}</p>
                </div>
              ))}
            </div>
            <div className="space-y-1 text-xs text-gray-500">
              {alumno.sesiones.ultima && (
                <p>📅 Última sesión: <span className="font-medium text-gray-700">{fmtFecha(alumno.sesiones.ultima)}</span></p>
              )}
              {alumno.sesiones.proxima && (
                <p>🔜 Próxima sesión: <span className="font-medium text-orange-600">{fmtFecha(alumno.sesiones.proxima)}</span></p>
              )}
              {!alumno.sesiones.ultima && !alumno.sesiones.proxima && (
                <p className="text-gray-400">Sin sesiones registradas aún.</p>
              )}
            </div>
          </div>

          {/* Progreso y contacto */}
          <div className="space-y-3">
            {/* Exámenes */}
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Progreso académico</p>
              {tieneExamenes ? (
                <div className="space-y-2">
                  <div>
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Examen inicio</span>
                      {alumno.fecha_examen_inicio && <span className="text-gray-400">{fmtFecha(alumno.fecha_examen_inicio)}</span>}
                    </div>
                    <ProgressBar value={alumno.examen_inicio !== null ? Number(alumno.examen_inicio) : 0} showLabel={alumno.examen_inicio !== null} />
                    {alumno.examen_inicio === null && <p className="text-xs text-gray-400 mt-0.5">Sin calificación</p>}
                  </div>
                  <div>
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Examen término</span>
                      {alumno.fecha_examen_termino && <span className="text-gray-400">{fmtFecha(alumno.fecha_examen_termino)}</span>}
                    </div>
                    <ProgressBar value={alumno.examen_termino !== null ? Number(alumno.examen_termino) : 0} showLabel={alumno.examen_termino !== null} />
                    {alumno.examen_termino === null && <p className="text-xs text-gray-400 mt-0.5">Sin calificación</p>}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-gray-400">El coordinador aún no ha capturado calificaciones.</p>
              )}
            </div>

            {/* Contacto */}
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Contacto</p>
              <div className="space-y-1.5 text-xs text-gray-600">
                {alumno.email && (
                  <p className="flex items-center gap-1.5">
                    <EnvelopeIcon className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                    <a href={`mailto:${alumno.email}`} className="hover:text-orange-500 truncate">{alumno.email}</a>
                  </p>
                )}
                {alumno.nombre_tutor_legal && (
                  <p className="flex items-center gap-1.5">
                    <span className="text-gray-400 flex-shrink-0">👤</span>
                    <span>Tutor legal: <span className="font-medium text-gray-700">{alumno.nombre_tutor_legal}</span></span>
                  </p>
                )}
                {alumno.tel_tutor && (
                  <p className="flex items-center gap-1.5">
                    <PhoneIcon className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                    <a href={`tel:${alumno.tel_tutor}`} className="hover:text-orange-500">{alumno.tel_tutor}</a>
                  </p>
                )}
                {!alumno.email && !alumno.nombre_tutor_legal && !alumno.tel_tutor && (
                  <p className="text-gray-400">Sin datos de contacto.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function MisAlumnos() {
  const [alumnos, setAlumnos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMisBeneficiarios()
      .then((r) => setAlumnos(r.data || []))
      .catch(() => toast.error('Error al cargar los alumnos'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center py-16"><Spinner size="lg" /></div>;
  }

  return (
    <div>
      <PageHeader
        title="Mis Alumnos"
        subtitle={`${alumnos.length} ${alumnos.length === 1 ? 'beneficiario asignado' : 'beneficiarios asignados'}`}
      />

      {alumnos.length === 0 ? (
        <EmptyState
          icon="👥"
          title="Sin alumnos asignados"
          description="El coordinador aún no te ha asignado ningún beneficiario."
        />
      ) : (
        <div className="space-y-3">
          {alumnos.map((a) => (
            <AlumnoRow key={a.id_benef} alumno={a} />
          ))}
        </div>
      )}
    </div>
  );
}
