import api from './axios';
export const getSesiones = (params) => api.get('/sesiones', { params });
export const getSesion = (id) => api.get(`/sesiones/${id}`);
export const createSesion = (data) => api.post('/sesiones', data);
export const updateSesion = (id, data) => api.put(`/sesiones/${id}`, data);
