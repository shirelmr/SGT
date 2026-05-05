import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { getPeriodos } from '../../api/periodos';
import { getHoras, addHorasExtra } from '../../api/horas';
import PageHeader from '../../components/shared/PageHeader';
import Spinner from '../../components/ui/Spinner';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';
import ProgressBar from '../../components/ui/ProgressBar';

function HorasExtraModal({ row, onClose, onSaved }) {
  const [horas, setHoras] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    const n = Number(horas);
    if (!n || n <= 0) return toast.error('Ingresa un número válido mayor a 0');
    setSaving(true);
    try {
      const r = await addHorasExtra(row.id_horas_acreditadas, n);
      onSaved(r.data);
      toast.success(`+${n} horas extra agregadas a ${row.tutor?.usuario?.nombre_completo || 'tutor'}`);
      onClose();
    } catch {
      toast.error('Error al agregar horas extra');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
        <h3 className="text-base font-semibold text-gray-800 mb-1">Agregar horas extra</h3>
        <p className="text-sm text-gray-500 mb-4">
          Tutor: <span className="font-medium text-gray-700">{row.tutor?.usuario?.nombre_completo || '—'}</span>
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Horas a agregar</label>
            <input
              type="number"
              min="0.5"
              step="0.5"
              value={horas}
              onChange={(e) => setHoras(e.target.value)}
              placeholder="Ej. 2"
              autoFocus
              className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm text-gray-600 hover:bg-gray-100 transition-colors"
            >
              Cancelar
            </button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Guardando...' : 'Agregar'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function HorasAcreditadas() {
  const [periodos, setPeriodos] = useState([]);
  const [selectedPeriodo, setSelectedPeriodo] = useState('');
  const [horas, setHoras] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalRow, setModalRow] = useState(null);

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
    getHoras({ id_periodo: selectedPeriodo })
      .then((r) => setHoras(r.data))
      .catch(() => setHoras([]))
      .finally(() => setLoading(false));
  }, [selectedPeriodo]);

  function handleSaved(updated) {
    setHoras((prev) => prev.map((h) => (h.id_horas_acreditadas === updated.id_horas_acreditadas ? updated : h)));
  }

  function exportCSV() {
    const periodoNombre = periodos.find((p) => String(p.id) === selectedPeriodo)?.nombre || 'periodo';
    const headers = ['Tutor', 'Horas Impartidas', 'Horas Extra', 'Total Horas', 'Porcentaje Acreditado (%)', 'Horas Acreditadas'];
    const rows = horas.map((h) => {
      const impartidas = Number(h.horas_impartidas);
      const extra = Number(h.horas_extra ?? 0);
      const total = impartidas + extra;
      const pct = Number(h.porcentaje_acred ?? 0);
      return [
        h.tutor?.usuario?.nombre_completo || '',
        impartidas,
        extra,
        total,
        pct,
        +(total * pct / 100).toFixed(1),
      ];
    });

    const csv = [headers, ...rows].map((r) => r.map((v) => `"${v}"`).join(',')).join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `horas_acreditadas_${periodoNombre}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <PageHeader title="Horas Acreditadas" subtitle="Consulta las horas impartidas por tutor" />

      <div className="flex flex-wrap items-end gap-4 mb-6">
        <div>
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
        {horas.length > 0 && (
          <Button onClick={exportCSV} variant="secondary">
            Exportar CSV
          </Button>
        )}
      </div>

      {!selectedPeriodo ? (
        <EmptyState icon="📊" title="Selecciona un periodo" description="Elige un periodo para ver las horas acreditadas" />
      ) : loading ? (
        <div className="flex items-center justify-center py-16"><Spinner size="lg" /></div>
      ) : horas.length === 0 ? (
        <EmptyState icon="📊" title="Sin datos" description="No hay datos de horas para este periodo" />
      ) : (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 font-medium text-gray-600">Tutor</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Horas Impartidas</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Horas Extra</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Total</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">% Acreditado</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Horas Acreditadas</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {horas.map((h) => {
                const impartidas = Number(h.horas_impartidas);
                const extra = Number(h.horas_extra ?? 0);
                const total = impartidas + extra;
                const pct = Number(h.porcentaje_acred ?? 0);
                const acreditadas = +(total * pct / 100).toFixed(1);
                return (
                  <tr key={h.id_horas_acreditadas} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-800">
                      {h.tutor?.usuario?.nombre_completo || '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{impartidas}</td>
                    <td className="px-4 py-3">
                      {extra > 0
                        ? <span className="text-green-600 font-medium">+{extra}</span>
                        : <span className="text-gray-400">—</span>}
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-800">{total}</td>
                    <td className="px-4 py-3 w-40">
                      <ProgressBar value={pct} />
                    </td>
                    <td className="px-4 py-3 text-gray-600">{acreditadas}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setModalRow(h)}
                        className="text-xs text-orange-500 hover:text-orange-700 font-medium border border-orange-200 hover:border-orange-400 rounded-lg px-2 py-1 transition-colors"
                      >
                        + Horas extra
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {modalRow && (
        <HorasExtraModal
          row={modalRow}
          onClose={() => setModalRow(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
