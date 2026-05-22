import api from './axios';

export const askDb = (pregunta, confirmarAltoVolumen = false) =>
  api.post('/ask-db', { pregunta, confirmarAltoVolumen });
export const getHistory = (limit = 20) => api.get('/ask-db/history', { params: { limit } });
