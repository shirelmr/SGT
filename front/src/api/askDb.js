import api from './axios';

export const askDb = (pregunta) => api.post('/ask-db', { pregunta });
export const getHistory = (limit = 20) => api.get('/ask-db/history', { params: { limit } });
