import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  ChevronDownIcon,
  ChevronUpIcon,
  AcademicCapIcon,
  CalendarDaysIcon,
  PhoneIcon,
  EnvelopeIcon,
  PencilSquareIcon,
} from '@heroicons/react/24/outline';
import { getMisBeneficiarios } from '../../api/tutor';
import { registrarExamen } from '../../api/beneficiarioPeriodo';
import PageHeader from '../../components/shared/PageHeader';
import ProgressBar from '../../components/ui/ProgressBar';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';

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

// Convierte "2026-05-12T00:00:00.000Z" → "2026-05-12" para inputs type="date"
function toDateInput(fechaStr) {
  if (!fechaStr) return '';
  return fechaStr.split('T')[0];
}

// ─── Modal de calificaciones ──────────────────────────────────────────────────
function ModalCalificaciones({ alumno, onClose, onSaved }) {
  const [form, setForm] = useState({
    pct_examen_inicio:   alumno.examen_inicio  != null ? String(Number(alumno.examen_inicio))  : '',
    fecha_examen_inicio: toDateInput(alumno.fecha_examen_inicio),
    pct_examen_termino:  alumno.examen_termino != null ? String(Number(alumno.examen_termino)) : '',
    fecha_examen_termino: toDateInput(alumno.fecha_examen_termino),
  });
  const [saving, setSaving] = useState(false);

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    // Validaciones básicas de rango
    const inicio  = form.pct_examen_inicio  !== '' ? Number(form.pct_examen_inicio)  : null;
    const termino = form.pct_examen_termino !== '' ? Number(form.pct_examen_termino) : null;

    if (inicio  != null && (inicio  < 0 || inicio  > 100)) return toast.error('El porcentaje de examen inicio debe estar entre 0 y 100');
    if (termino != null && (termino < 0 || termino > 100)) return toast.error('El porcentaje de examen término debe estar entre 0 y 100');
    if (!alumno.id_periodo_activo) return toast.error('No hay un periodo activo para registrar calificaciones');

    const payload = {};
    if (inicio  != null)               payload.pct_examen_inicio   = inicio;
    if (form.fecha_examen_inicio)      payload.fecha_examen_inicio  = form.fecha_examen_inicio;
    if (termino != null)               payload.pct_examen_termino  = termino;
    if (form.fecha_examen_termino)     payload.fecha_examen_termino = form.fecha_examen_termino;

    setSaving(true);
    try {
      await registrarExamen(alumno.id_benef, alumno.id_periodo_activo, payload);
      toast.success('Calificaciones guardadas');
      onSaved({
        examen_inicio:       inicio,
        fecha_examen_inicio: form.fecha_examen_inicio || null,
        examen_termino:      termino,
        fecha_examen_termino: form.fecha_examen_termino || null,
      });
      onClose();
    } catch {
      toast.error('Error al guardar las calificaciones');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={`Calificaciones — ${alumno.nombre_completo}`}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>Cancelar</Button>
          <Button onClick={handleSubmit} loading={saving}>Guardar</Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Examen inicio */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Examen de inicio
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Calificación (%)</label>
              <input
                type="number"
                name="pct_examen_inicio"
                value={form.pct_examen_inicio}
                onChange={handleChange}
                min="0"
                max="100"
                step="0.01"
                placeholder="Ej. 75"
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Fecha</label>
              <input
                type="date"
                name="fecha_examen_inicio"
                value={form.fecha_examen_inicio}
                onChange={handleChange}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>
          </div>
        </div>

        <div className="border-t border-gray-100" />

        {/* Examen término */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Examen de término
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Calificación (%)</label>
              <input
                type="number"
                name="pct_examen_termino"
                value={form.pct_examen_termino}
                onChange={handleChange}
                min="0"
                max="100"
                step="0.01"
                placeholder="Ej. 90"
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Fecha</label>
              <input
                type="date"
                name="fecha_examen_termino"
                value={form.fecha_examen_termino}
                onChange={handleChange}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>
          </div>
        </div>

        <p className="text-xs text-gray-400">
          Puedes dejar vacíos los campos que aún no apliquen. Los cambios sobreescriben los valores anteriores.
        </p>
      </form>
    </Modal>
  );
}

// ─── Fila de alumno (colapsable) ──────────────────────────────────────────────
function AlumnoRow({ alumno, onEditCalificaciones }) {
  const [open, setOpen] = useState(false);
  const color = colorPorNombre(alumno.nombre_completo);
  const ini = iniciales(alumno.nombre_completo);

  const ses = alumno.sesiones ?? { total: 0, realizadas: 0, proxima: null, ultima: null };
  const tieneExamenes = alumno.examen_inicio != null || alumno.examen_termino != null;

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
            <span><strong className="text-gray-700">{ses.realizadas}</strong>/{ses.total} sesiones</span>
          </span>
          {tieneExamenes && (
            <span className="flex items-center gap-1">
              <AcademicCapIcon className="w-3.5 h-3.5" />
              <span>
                {alumno.examen_inicio  != null ? `${Number(alumno.examen_inicio)}%`  : '—'}
                {' → '}
                {alumno.examen_termino != null ? `${Number(alumno.examen_termino)}%` : '—'}
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
                { label: 'Total',     value: ses.total },
                { label: 'Realizadas', value: ses.realizadas },
                { label: 'Pendientes', value: ses.total - ses.realizadas },
              ].map(({ label, value }) => (
                <div key={label} className="bg-gray-50 rounded-xl p-2.5 text-center">
                  <p className="font-sora font-bold text-gray-800 text-lg">{value}</p>
                  <p className="text-xs text-gray-400">{label}</p>
                </div>
              ))}
            </div>
            <div className="space-y-1 text-xs text-gray-500">
              {ses.ultima && (
                <p>📅 Última sesión: <span className="font-medium text-gray-700">{fmtFecha(ses.ultima)}</span></p>
              )}
              {ses.proxima && (
                <p>🔜 Próxima sesión: <span className="font-medium text-orange-600">{fmtFecha(ses.proxima)}</span></p>
              )}
              {!ses.ultima && !ses.proxima && (
                <p className="text-gray-400">Sin sesiones registradas aún.</p>
              )}
            </div>
          </div>

          {/* Progreso y contacto */}
          <div className="space-y-3">

            {/* ── Exámenes ── */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Progreso académico</p>
                {alumno.id_periodo_activo && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onEditCalificaciones(alumno); }}
                    className="flex items-center gap-1 text-xs text-orange-500 hover:text-orange-700 font-medium transition-colors"
                  >
                    <PencilSquareIcon className="w-3.5 h-3.5" />
                    {tieneExamenes ? 'Editar' : 'Registrar'}
                  </button>
                )}
              </div>

              {tieneExamenes ? (
                <div className="space-y-2">
                  <div>
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Examen inicio</span>
                      {alumno.fecha_examen_inicio && (
                        <span className="text-gray-400">{fmtFecha(alumno.fecha_examen_inicio)}</span>
                      )}
                    </div>
                    <ProgressBar
                      value={alumno.examen_inicio != null ? Number(alumno.examen_inicio) : 0}
                      showLabel={alumno.examen_inicio != null}
                    />
                    {alumno.examen_inicio == null && (
                      <p className="text-xs text-gray-400 mt-0.5">Sin calificación</p>
                    )}
                  </div>
                  <div>
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Examen término</span>
                      {alumno.fecha_examen_termino && (
                        <span className="text-gray-400">{fmtFecha(alumno.fecha_examen_termino)}</span>
                      )}
                    </div>
                    <ProgressBar
                      value={alumno.examen_termino != null ? Number(alumno.examen_termino) : 0}
                      showLabel={alumno.examen_termino != null}
                    />
                    {alumno.examen_termino == null && (
                      <p className="text-xs text-gray-400 mt-0.5">Sin calificación</p>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-gray-400">
                  {alumno.id_periodo_activo
                    ? 'Aún no hay calificaciones registradas. Usa el botón "Registrar" para agregarlas.'
                    : 'No hay un periodo activo para registrar calificaciones.'}
                </p>
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
  const [alumnos, setAlumnos]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [alumnoModal, setAlumnoModal] = useState(null); // alumno seleccionado para editar

  useEffect(() => {
    getMisBeneficiarios()
      .then((r) => setAlumnos(r.data || []))
      .catch(() => toast.error('Error al cargar los alumnos'))
      .finally(() => setLoading(false));
  }, []);

  // Actualiza el alumno en el estado local tras guardar sin re-fetch
  function handleSaved(id_benef, nuevoProgreso) {
    setAlumnos((prev) =>
      prev.map((a) =>
        a.id_benef === id_benef
          ? {
              ...a,
              examen_inicio:        nuevoProgreso.examen_inicio,
              fecha_examen_inicio:  nuevoProgreso.fecha_examen_inicio || a.fecha_examen_inicio,
              examen_termino:       nuevoProgreso.examen_termino,
              fecha_examen_termino: nuevoProgreso.fecha_examen_termino || a.fecha_examen_termino,
            }
          : a
      )
    );
  }

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
            <AlumnoRow
              key={a.id_benef}
              alumno={a}
              onEditCalificaciones={setAlumnoModal}
            />
          ))}
        </div>
      )}

      {/* Modal de calificaciones */}
      {alumnoModal && (
        <ModalCalificaciones
          alumno={alumnoModal}
          onClose={() => setAlumnoModal(null)}
          onSaved={(progreso) => handleSaved(alumnoModal.id_benef, progreso)}
        />
      )}
    </div>
  );
}
