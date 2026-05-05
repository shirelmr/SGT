import api from './axios';
export const getUsuarios = (params) => api.get('/usuarios', { params });
export const createUsuario = (data) => api.post('/usuarios', data);
export const updateUsuario = (id, data) => api.put(`/usuarios/${id}`, data);
export const deleteUsuario = (id) => api.delete(`/usuarios/${id}`);
export const asignarAutomatico = (beneficiarios_por_tutor) => api.post('/usuarios/asignar-automatico', { beneficiarios_por_tutor });
