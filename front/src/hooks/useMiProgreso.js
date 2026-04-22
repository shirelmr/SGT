import { useState, useEffect } from 'react';
import { getProgreso } from '../api/beneficiarioPeriodo';

export function getMotivacion(avance) {
  if (avance == null) return '';
  if (avance <= 30) return '¡Estás comenzando! Sigue adelante.';
  if (avance <= 60) return '¡Buen progreso! Continúa así.';
  return '¡Excelente desempeño!';
}

export function calcularAvance(progreso) {
  if (progreso?.pct_examen_inicio != null && progreso?.pct_examen_termino != null) {
    return progreso.pct_examen_termino - progreso.pct_examen_inicio;
  }
  return null;
}

export function useMiProgreso() {
  const [progreso, setProgreso] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getProgreso()
      .then((r) => setProgreso(r.data))
      .catch(() => setProgreso(null))
      .finally(() => setLoading(false));
  }, []);

  return {
    loading,
    progreso,
    avance: calcularAvance(progreso),
  };
}
