import api from './axios';
export const confirmarAsistencia = (id_sesion) => api.post(`/asistencias/${id_sesion}/confirmar`);
export const getAsistencia = (id_sesion) => api.get(`/asistencias/${id_sesion}`);
