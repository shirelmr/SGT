import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { getHoras } from '../../api/horas';
import { getPeriodos } from '../../api/periodos';
import PageHeader from '../../components/shared/PageHeader';
import Card from '../../components/ui/Card';
import Table from '../../components/ui/Table';
import Spinner from '../../components/ui/Spinner';
import ProgressBar from '../../components/ui/ProgressBar';

export default function MisHoras() {
  const [periodos, setPeriodos] = useState([]);
  const [horasActual, setHorasActual] = useState(null);
  const [historial, setHistorial] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [pRes, hRes] = await Promise.allSettled([
          getPeriodos(),
          getHoras(),
        ]);
        if (pRes.status === 'fulfilled') setPeriodos(pRes.value.data);
        if (hRes.status === 'fulfilled') {
          const data = hRes.value.data;
          if (Array.isArray(data)) {
            const active = data.find((h) => h.periodo_activo);
            setHorasActual(active || data[0] || null);
            setHistorial(data);
          } else {
            setHorasActual(data);
          }
        }
      } catch {
        toast.error('Error al cargar horas');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const columns = [
    { key: 'periodo', label: 'Periodo', render: (_, row) => row.periodo?.nombre || '—' },
    { key: 'horas_impartidas', label: 'Horas Impartidas', render: (v) => Number(v ?? 0) },
    {
      key: 'horas_esperadas',
      label: 'Horas Esperadas',
      render: (_, row) => Number(row.periodo?.horas_esperadas ?? 0),
    },
    {
      key: 'porcentaje_acred',
      label: 'Porcentaje',
      render: (v, row) => {
        const impartidas = Number(row.horas_impartidas ?? 0);
        const esperadas = Number(row.periodo?.horas_esperadas ?? 0);
        return (
          <div>
            <ProgressBar value={Math.min(Number(v ?? 0), 100)} />
            {esperadas > 0 && (
              <p className="text-xs text-gray-400 mt-1">{impartidas} / {esperadas} hrs esperadas</p>
            )}
          </div>
        );
      },
    },
    { key: 'horas_acreditadas', label: 'Horas Acreditadas', render: (_, row) => Number(row.horas_impartidas ?? 0) },
  ];

  if (loading) {
    return <div className="flex items-center justify-center py-16"><Spinner size="lg" /></div>;
  }

  return (
    <div>
      <PageHeader title="Mis Horas" subtitle="Consulta tus horas impartidas y acreditadas" />

      {/* Current period */}
      {horasActual && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <Card borderColor="#f97316">
            <p className="text-gray-500 text-sm">Horas impartidas</p>
            <p className="font-sora text-3xl font-bold text-gray-900 mt-1">{horasActual.horas_impartidas ?? 0}</p>
          </Card>
          <Card borderColor="#22c55e">
            <p className="text-gray-500 text-sm">Porcentaje acreditado</p>
            <div className="mt-2">
              <ProgressBar value={Math.min(Number(horasActual.porcentaje_acred ?? 0), 100)} />
            </div>
            {Number(horasActual.periodo?.horas_esperadas ?? 0) > 0 && (
              <p className="text-xs text-gray-400 mt-1">
                {Number(horasActual.horas_impartidas ?? 0)} / {Number(horasActual.periodo.horas_esperadas)} hrs esperadas
              </p>
            )}
          </Card>
          <Card borderColor="#3b82f6">
            <p className="text-gray-500 text-sm">Horas acreditadas</p>
            <p className="font-sora text-3xl font-bold text-gray-900 mt-1">{Number(horasActual.horas_impartidas ?? 0)}</p>
          </Card>
        </div>
      )}

      {/* Historial */}
      <Card title="Historial por periodo">
        <Table
          columns={columns}
          data={Array.isArray(historial) ? historial : horasActual ? [horasActual] : []}
          loading={false}
          emptyMessage="No hay historial de horas"
        />
      </Card>
    </div>
  );
}
