import api from './axios';
export const getPeriodos = () => api.get('/periodos');
export const createPeriodo = (data) => api.post('/periodos', data);
export const updatePeriodo = (id, data) => api.put(`/periodos/${id}`, data);
export const deletePeriodo = (id) => api.delete(`/periodos/${id}`);
