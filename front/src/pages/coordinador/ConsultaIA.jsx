import { useState } from 'react';
import { SparklesIcon, CodeBracketIcon } from '@heroicons/react/24/outline';
import { askDb } from '../../api/askDb';
import PageHeader from '../../components/shared/PageHeader';
import Button from '../../components/ui/Button';

export default function ConsultaIA() {
  const [pregunta, setPregunta] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!pregunta.trim()) return;

    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const { data } = await askDb(pregunta.trim());
      setResult(data);
    } catch (err) {
      setError(err?.response?.data?.error || 'Error al procesar la consulta');
    } finally {
      setLoading(false);
    }
  }

  const columns = result?.results?.length > 0 ? Object.keys(result.results[0]) : [];

  return (
    <div>
      <PageHeader
        title="Consulta IA"
        subtitle="Haz preguntas en español sobre los datos del sistema"
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
        <div className="space-y-4">
          {/* SQL generated */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="flex items-center gap-2 mb-3">
              <CodeBracketIcon className="w-4 h-4 text-gray-400" />
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                SQL generado
              </span>
            </div>
            <pre className="bg-gray-50 rounded-xl px-4 py-3 text-sm text-gray-700 font-mono overflow-x-auto whitespace-pre-wrap">
              {result.sql}
            </pre>
          </div>

          {/* Data table */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold text-gray-700">
                Resultados
              </span>
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
                      <tr
                        key={i}
                        className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                      >
                        {columns.map((col) => (
                          <td
                            key={col}
                            className="px-3 py-2.5 text-gray-700 whitespace-nowrap"
                          >
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
    </div>
  );
}
