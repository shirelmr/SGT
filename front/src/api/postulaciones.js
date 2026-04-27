import api from './axios';

export const getPostulaciones = (params) => api.get('/postulaciones', { params });

export const createPostulacion = (formData) =>
  api.post('/postulaciones', formData);

export const aceptarPostulacion = (id) => api.patch(`/postulaciones/${id}/aceptar`);
export const rechazarPostulacion = (id) => api.patch(`/postulaciones/${id}/rechazar`);
