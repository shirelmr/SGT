import api from './axios';
export const getHoras = (params) => api.get('/horas-acreditadas', { params });
export const addHorasExtra = (id, horas) => api.patch(`/horas-acreditadas/${id}/horas-extra`, { horas });
