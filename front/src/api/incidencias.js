import api from './axios';
export const getIncidenciasSesion = (id_sesion) => api.get(`/incidencias/sesion/${id_sesion}`);
export const createIncidencia = (data) => api.post('/incidencias', data);
