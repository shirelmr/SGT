import { useState, useEffect, useCallback } from 'react';
import { SparklesIcon, CodeBracketIcon, ClockIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { askDb, getHistory } from '../../api/askDb';
import PageHeader from '../../components/shared/PageHeader';
import Button from '../../components/ui/Button';
import ConfirmDialog from '../../components/shared/ConfirmDialog';

function formatDate(iso) {
  return new Date(iso).toLocaleString('es-MX', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

export default function ConsultaIA() {
  const [pregunta, setPregunta] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [expandedId, setExpandedId] = useState(null);

  const [warningData, setWarningData] = useState(null); // { mensaje, pregunta }

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const { data } = await getHistory(20);
      setHistory(data);
    } catch {
      // historial no crítico, falla silenciosamente
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!pregunta.trim()) return;
    await ejecutarPregunta(pregunta.trim());
  }

  async function ejecutarPregunta(texto, confirmarAltoVolumen = false) {
    setPregunta(texto);
    setLoading(true);
    setResult(null);
    setError(null);
    setWarningData(null);

    try {
      const { data } = await askDb(texto, confirmarAltoVolumen);

      if (data.warning) {
        setWarningData({ mensaje: data.mensaje, pregunta: texto });
        return;
      }

      setResult(data);
      await loadHistory();
    } catch (err) {
      setError(err?.response?.data?.error || 'Error al procesar la consulta');
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirmarAltoVolumen() {
    if (!warningData) return;
    await ejecutarPregunta(warningData.pregunta, true);
  }

  const columns = result?.results?.length > 0 ? Object.keys(result.results[0]) : [];

  return (
    <div>
      <PageHeader
        title="Consulta IA"
        subtitle="Haz preguntas en español sobre los datos del sistema"
      />

      <ConfirmDialog
        isOpen={!!warningData}
        onClose={() => setWarningData(null)}
        onConfirm={handleConfirmarAltoVolumen}
        title="Consulta de alto volumen"
        message={warningData?.mensaje || ''}
        confirmLabel="Continuar de todas formas"
        loading={loading}
      />

      {/* Query input */}
      <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">
              ¿Qué quieres saber?
            </label>
            <textarea
              value={pregunta}
              onChange={(e) => setPregunta(e.target.value)}
              placeholder="Ejemplo: ¿Cuántos tutores hay en el periodo activo? ¿Cuáles beneficiarios tienen más sesiones realizadas?"
              rows={3}
              className="border-2 border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 resize-none transition-colors"
            />
          </div>

          <div className="flex justify-end">
            <Button type="submit" loading={loading} disabled={!pregunta.trim()}>
              <SparklesIcon className="w-4 h-4" />
              {loading ? 'Consultando...' : 'Consultar'}
            </Button>
          </div>
        </form>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl px-5 py-4 mb-6">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-4 mb-8">
          {result.respuesta && (
            <div className="bg-orange-50 border border-orange-200 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-2">
                <SparklesIcon className="w-4 h-4 text-orange-500" />
                <span className="text-xs font-semibold text-orange-600 uppercase tracking-wide">
                  Respuesta IA
                </span>
              </div>
              <p className="text-sm text-orange-900 whitespace-pre-wrap leading-relaxed">
                {result.respuesta}
              </p>
            </div>
          )}

          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="flex items-center gap-2 mb-3">
              <CodeBracketIcon className="w-4 h-4 text-gray-400" />
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                SQL generado {result.sqls?.length > 1 ? `(${result.sqls.length} consultas)` : ''}
              </span>
            </div>
            <pre className="bg-gray-50 rounded-xl px-4 py-3 text-sm text-gray-700 font-mono overflow-x-auto whitespace-pre-wrap">
              {result.sql}
            </pre>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold text-gray-700">Resultados</span>
              <span className="text-xs text-gray-400">
                {result.results.length} {result.results.length === 1 ? 'fila' : 'filas'}
              </span>
            </div>

            {result.results.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">
                La consulta no devolvió resultados.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      {columns.map((col) => (
                        <th
                          key={col}
                          className="text-left px-3 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap"
                        >
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {result.results.map((row, i) => (
                      <tr key={i} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                        {columns.map((col) => (
                          <td key={col} className="px-3 py-2.5 text-gray-700 whitespace-nowrap">
                            {row[col] === null || row[col] === undefined
                              ? <span className="text-gray-300">—</span>
                              : String(row[col])}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* History */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ClockIcon className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-semibold text-gray-700">Historial de consultas</span>
          </div>
          <button
            onClick={loadHistory}
            disabled={historyLoading}
            className="text-gray-400 hover:text-orange-500 transition-colors"
            title="Recargar historial"
          >
            <ArrowPathIcon className={`w-4 h-4 ${historyLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {history.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">
            {historyLoading ? 'Cargando...' : 'No hay consultas registradas aún.'}
          </p>
        ) : (
          <div className="divide-y divide-gray-50">
            {history.map((item) => (
              <div key={item.id} className="py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800 truncate">{item.pregunta}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {formatDate(item.timestamp)} · {item.filasDevueltas} {item.filasDevueltas === 1 ? 'fila' : 'filas'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                      className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {expandedId === item.id ? 'Ocultar SQL' : 'Ver SQL'}
                    </button>
                    <button
                      onClick={() => ejecutarPregunta(item.pregunta)}
                      disabled={loading}
                      className="flex items-center gap-1 text-xs text-orange-500 hover:text-orange-600 font-medium transition-colors disabled:opacity-40"
                    >
                      <SparklesIcon className="w-3.5 h-3.5" />
                      Re-ejecutar
                    </button>
                  </div>
                </div>

                {expandedId === item.id && (
                  <pre className="mt-2 bg-gray-50 rounded-lg px-3 py-2 text-xs text-gray-600 font-mono overflow-x-auto whitespace-pre-wrap">
                    {item.sqlGenerado}
                  </pre>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
