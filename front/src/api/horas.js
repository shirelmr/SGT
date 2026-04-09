import api from './axios';
export const getHoras = (params) => api.get('/horas-acreditadas', { params });
