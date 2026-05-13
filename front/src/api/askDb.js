import api from './axios';

export const askDb = (pregunta) => api.post('/ask-db', { pregunta });
