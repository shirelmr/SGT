import api from './axios';
export const getTutorPerfil = () => api.get('/tutor/perfil');
export const updateTutorPerfil = (data) => api.put('/tutor/perfil', data);
export const getMisBeneficiarios = () => api.get('/tutor/mis-beneficiarios');
