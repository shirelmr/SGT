import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getBitacoras } from '../../api/bitacoras';
import { getPeriodos } from '../../api/periodos';
import PageHeader from '../../components/shared/PageHeader';
import Table from '../../components/ui/Table';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';

const estadoBadge = {
  pendiente: 'warning',
  revisado: 'info',
  aprobado: 'success',
};

export default function Bitacoras() {
  const [bitacoras, setBitacoras] = useState([]);
  const [periodos, setPeriodos] = useState([]);
  const [selectedPeriodo, setSelectedPeriodo] = useState('');
  const [filterTutor, setFilterTutor] = useState('');
  const [filterEstado, setFilterEstado] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    getPeriodos()
      .then((r) => {
        setPeriodos(r.data);
        const active = r.data.find((p) => p.activo);
        if (active) setSelectedPeriodo(String(active.id));
      })
      .catch(() => toast.error('Error al cargar periodos'));
  }, []);

  useEffect(() => {
    if (!selectedPeriodo) return;
    setLoading(true);
    getBitacoras({ id_periodo: selectedPeriodo })
      .then((r) => setBitacoras(r.data || []))
      .catch(() => setBitacoras([]))
      .finally(() => setLoading(false));
  }, [selectedPeriodo]);

  const tutores = [...new Set(bitacoras.map((b) => b.sesion?.tutor?.nombre_completo).filter(Boolean))];

  const filtered = bitacoras.filter((b) => {
    const tutorMatch = !filterTutor || b.sesion?.tutor?.nombre_completo === filterTutor;
    const estadoMatch = !filterEstado || b.ultimo_estado === filterEstado;
    return tutorMatch && estadoMatch;
  });

  const columns = [
    {
      key: 'tutor',
      label: 'Tutor',
      render: (_, row) => row.sesion?.tutor?.nombre_completo || '—',
    },
    {
      key: 'beneficiario',
      label: 'Beneficiario',
      render: (_, row) => row.sesion?.beneficiario?.nombre_completo || '—',
    },
    {
      key: 'fecha_sesion',
      label: 'Fecha sesión',
      render: (_, row) => row.sesion?.fecha ? new Date(row.sesion.fecha).toLocaleDateString('es-MX') : '—',
    },
    {
      key: 'fecha_registro',
      label: 'Fecha registro',
      render: (_, row) => row.fecha_registro ? new Date(row.fecha_registro).toLocaleDateString('es-MX') : '—',
    },
    {
      key: 'ultimo_estado',
      label: 'Estado',
      render: (v) => v ? <Badge variant={estadoBadge[v] || 'default'}>{v}</Badge> : <Badge variant="default">Sin revisión</Badge>,
    },
    {
      key: 'acciones',
      label: 'Acciones',
      render: (_, row) => (
        <Button size="sm" onClick={() => navigate(`/revisor/bitacoras/${row.id_sesion}`)}>
          Revisar
        </Button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Bitácoras" subtitle="Revisa y comenta las bitácoras de los tutores" />

      <div className="flex flex-wrap gap-3 mb-6">
        <select
          value={selectedPeriodo}
          onChange={(e) => setSelectedPeriodo(e.target.value)}
          className="border-2 border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-orange-400"
        >
          <option value="">Seleccionar periodo</option>
          {periodos.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
        </select>

        <select
          value={filterTutor}
          onChange={(e) => setFilterTutor(e.target.value)}
          className="border-2 border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-orange-400"
        >
          <option value="">Todos los tutores</option>
          {tutores.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>

        <select
          value={filterEstado}
          onChange={(e) => setFilterEstado(e.target.value)}
          className="border-2 border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-orange-400"
        >
          <option value="">Todos los estados</option>
          <option value="pendiente">Pendiente</option>
          <option value="revisado">Revisado</option>
          <option value="aprobado">Aprobado</option>
        </select>
      </div>

      {!selectedPeriodo ? (
        <EmptyState icon="📋" title="Selecciona un periodo" description="Elige un periodo para ver las bitácoras" />
      ) : (
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <Table
            columns={columns}
            data={filtered}
            loading={loading}
            emptyMessage="No hay bitácoras en este periodo"
          />
        </div>
      )}
    </div>
  );
}
