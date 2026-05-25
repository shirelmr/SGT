import api from './axios';
export const getBeneficiariosPeriodo = (id_periodo) => api.get(`/beneficiario-periodo/${id_periodo}`);
export const getBeneficiariosAnteriores = () => api.get('/beneficiario-periodo/anteriores');
export const registrarExamen = (id_benef, id_periodo, data) => api.put('/beneficiario-periodo/registrar', { id_benef, id_periodo, ...data });
export const getProgreso = () => api.get('/beneficiario-periodo/mi-progreso');
