import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { getPeriodos } from '../../api/periodos';
import { getHoras } from '../../api/horas';
import PageHeader from '../../components/shared/PageHeader';
import Table from '../../components/ui/Table';
import EmptyState from '../../components/ui/EmptyState';
import ProgressBar from '../../components/ui/ProgressBar';

export default function HorasAcreditadas() {
  const [periodos, setPeriodos] = useState([]);
  const [selectedPeriodo, setSelectedPeriodo] = useState('');
  const [horas, setHoras] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getPeriodos()
      .then((r) => {
        setPeriodos(r.data);
        const active = r.data.find((p) => p.activo);
        if (active) {
          setSelectedPeriodo(String(active.id));
        }
      })
      .catch(() => toast.error('Error al cargar periodos'));
  }, []);

  useEffect(() => {
    if (!selectedPeriodo) return;
    setLoading(true);
    getHoras({ id_periodo: selectedPeriodo })
      .then((r) => setHoras(r.data))
      .catch(() => setHoras([]))
      .finally(() => setLoading(false));
  }, [selectedPeriodo]);

  const columns = [
    { key: 'tutor', label: 'Tutor', render: (v, row) => row.tutor?.nombre_completo || v || '—' },
    { key: 'horas_impartidas', label: 'Horas Impartidas' },
    {
      key: 'porcentaje_acreditado',
      label: 'Porcentaje Acreditado',
      render: (v) => <ProgressBar value={v ?? 0} />,
    },
    { key: 'horas_acreditadas', label: 'Horas Acreditadas' },
  ];

  return (
    <div>
      <PageHeader title="Horas Acreditadas" subtitle="Consulta las horas impartidas por tutor" />

      <div className="mb-6">
        <label className="text-sm font-medium text-gray-700 block mb-1">Periodo</label>
        <select
          value={selectedPeriodo}
          onChange={(e) => setSelectedPeriodo(e.target.value)}
          className="border-2 border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
        >
          <option value="">Seleccionar periodo</option>
          {periodos.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
        </select>
      </div>

      {!selectedPeriodo ? (
        <EmptyState icon="📊" title="Selecciona un periodo" description="Elige un periodo para ver las horas acreditadas" />
      ) : (
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <Table
            columns={columns}
            data={horas}
            loading={loading}
            emptyMessage="No hay datos de horas para este periodo"
          />
        </div>
      )}
    </div>
  );
}
