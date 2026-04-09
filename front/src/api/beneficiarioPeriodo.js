import api from './axios';
export const getBeneficiariosPeriodo = (id_periodo) => api.get(`/beneficiario-periodo/${id_periodo}`);
export const registrarExamen = (id, data) => api.put(`/beneficiario-periodo/${id}`, data);
export const getProgreso = () => api.get('/beneficiario-periodo/mi-progreso');
