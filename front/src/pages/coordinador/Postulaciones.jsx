import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { EyeIcon } from '@heroicons/react/24/outline';
import {
  getPostulaciones,
  aceptarPostulacion,
  rechazarPostulacion,
} from '../../api/postulaciones';
import PageHeader from '../../components/shared/PageHeader';
import Table from '../../components/ui/Table';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';

const estadoBadge = { pendiente: 'warning', aceptado: 'success', rechazado: 'danger' };
const estadoLabel = { pendiente: 'Pendiente', aceptado: 'Aceptado', rechazado: 'Rechazado' };

const BASE_URL = import.meta.env.VITE_API_URL.replace('/api', '');

export default function Postulaciones() {
  const [postulaciones, setPostulaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState('');
  const [selected, setSelected] = useState(null);
  const [acting, setActing] = useState(false);

  useEffect(() => { loadData(); }, [filtroEstado]);

  async function loadData() {
    setLoading(true);
    try {
      const params = filtroEstado ? { estado: filtroEstado } : {};
      const res = await getPostulaciones(params);
      setPostulaciones(res.data);
    } catch {
      toast.error('Error al cargar postulaciones');
    } finally {
      setLoading(false);
    }
  }

  async function handleAceptar(id) {
    setActing(true);
    try {
      await aceptarPostulacion(id);
      toast.success('Postulación aceptada');
      setSelected(null);
      loadData();
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Error al aceptar');
    } finally {
      setActing(false);
    }
  }

  async function handleRechazar(id) {
    setActing(true);
    try {
      await rechazarPostulacion(id);
      toast.success('Postulación rechazada');
      setSelected(null);
      loadData();
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Error al rechazar');
    } finally {
      setActing(false);
    }
  }

  const columns = [
    { key: 'nombre_completo', label: 'Nombre' },
    { key: 'email', label: 'Correo' },
    { key: 'matricula', label: 'Matrícula' },
    { key: 'carrera', label: 'Carrera' },
    { key: 'semestre', label: 'Semestre' },
    {
      key: 'fecha_postulacion',
      label: 'Fecha',
      render: (v) => new Date(v).toLocaleDateString('es-MX'),
    },
    {
      key: 'estado',
      label: 'Estado',
      render: (v) => <Badge variant={estadoBadge[v]}>{estadoLabel[v]}</Badge>,
    },
    {
      key: 'acciones',
      label: '',
      render: (_, row) => (
        <button
          onClick={() => setSelected(row)}
          className="p-1.5 rounded-lg hover:bg-orange-50 text-orange-500 transition-colors"
        >
          <EyeIcon className="w-4 h-4" />
        </button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Postulaciones"
        subtitle="Revisa y gestiona las postulaciones del periodo activo"
      />

      {/* Filter */}
      <div className="mb-4 flex items-center gap-3">
        <span className="text-sm text-gray-500 font-medium">Filtrar por estado:</span>
        {['', 'pendiente', 'aceptado', 'rechazado'].map((e) => (
          <button
            key={e}
            onClick={() => setFiltroEstado(e)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              filtroEstado === e
                ? 'text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            style={filtroEstado === e ? { backgroundColor: '#4a1f06' } : {}}
          >
            {e === '' ? 'Todos' : estadoLabel[e]}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-6">
        <Table
          columns={columns}
          data={postulaciones}
          loading={loading}
          emptyMessage="No hay postulaciones para este periodo"
        />
      </div>

      {/* Detail modal */}
      <Modal
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title="Detalle de postulación"
        size="lg"
        footer={
          selected?.estado === 'pendiente' ? (
            <>
              <Button variant="secondary" onClick={() => setSelected(null)}>Cerrar</Button>
              <Button variant="danger" loading={acting} onClick={() => handleRechazar(selected.id_postulacion)}>
                Rechazar
              </Button>
              <Button loading={acting} onClick={() => handleAceptar(selected.id_postulacion)}>
                Aceptar
              </Button>
            </>
          ) : (
            <Button variant="secondary" onClick={() => setSelected(null)}>Cerrar</Button>
          )
        }
      >
        {selected && (
          <div className="space-y-5">
            {/* Status banner */}
            <div className="flex items-center gap-2">
              <Badge variant={estadoBadge[selected.estado]} className="text-sm px-3 py-1">
                {estadoLabel[selected.estado]}
              </Badge>
              <span className="text-xs text-gray-400">
                Recibida el {new Date(selected.fecha_postulacion).toLocaleDateString('es-MX', { dateStyle: 'long' })}
              </span>
            </div>

            {/* Personal data */}
            <section>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Datos personales</p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-gray-400 text-xs">Nombre</p><p className="font-medium">{selected.nombre_completo}</p></div>
                <div><p className="text-gray-400 text-xs">Correo</p><p className="font-medium">{selected.email}</p></div>
                <div><p className="text-gray-400 text-xs">Matrícula</p><p className="font-medium">{selected.matricula}</p></div>
                <div><p className="text-gray-400 text-xs">Semestre</p><p className="font-medium">{selected.semestre}</p></div>
                <div className="col-span-2"><p className="text-gray-400 text-xs">Carrera</p><p className="font-medium">{selected.carrera}</p></div>
              </div>
            </section>

            {/* Application answers */}
            <section>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Preguntas de postulación</p>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-gray-400 text-xs mb-1">¿Por qué deberían escogerte?</p>
                  <p className="text-gray-800 bg-gray-50 rounded-xl p-3 leading-relaxed">{selected.por_que_escogerte}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs mb-1">¿Por qué te interesa ser tutor?</p>
                  <p className="text-gray-800 bg-gray-50 rounded-xl p-3 leading-relaxed">{selected.por_que_interesa}</p>
                </div>
              </div>
            </section>

            {/* Video link */}
            {selected.link_video && (
              <section>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Video de presentación</p>
                <a
                  href={selected.link_video}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-medium hover:underline"
                  style={{ color: '#ee7e4c' }}
                >
                  Ver video en YouTube →
                </a>
              </section>
            )}

            {/* Duolingo screenshot */}
            {selected.captura_duolingo && (
              <section>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Captura de Duolingo</p>
                <img
                  src={`${BASE_URL}${selected.captura_duolingo}`}
                  alt="Captura Duolingo"
                  className="rounded-xl border border-gray-100 max-h-64 object-contain"
                />
              </section>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
