import api from './axios';
export const getBitacora = (id_sesion) => api.get(`/bitacoras/${id_sesion}`);
export const createBitacora = (data) => api.post('/bitacoras', data);
export const updateBitacora = (id, data) => api.put(`/bitacoras/${id}`, data);
export const getBitacoras = (params) => api.get('/bitacoras', { params });
export const uploadEvidencia = (formData) =>
  api.post('/upload', formData);
