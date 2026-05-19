import api from './axios';
export const getUsuarios = (params) => api.get('/usuarios', { params });
export const createUsuario = (data) => api.post('/usuarios', data);
export const updateUsuario = (id, data) => api.put(`/usuarios/${id}`, data);
export const deleteUsuario = (id) => api.delete(`/usuarios/${id}`);
export const asignarAutomatico = (beneficiarios_por_tutor) => api.post('/usuarios/asignar-automatico', { beneficiarios_por_tutor });
export const asignarRevisoresAutomatico = (tutores_por_revisor) => api.post('/usuarios/asignar-revisores-automatico', { tutores_por_revisor });
export const getUsuarioResumen = (id, params) => api.get(`/usuarios/${id}/resumen`, { params });
