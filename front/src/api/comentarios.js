import api from './axios';
export const getComentarios = (id_bitacora) => api.get(`/comentarios/${id_bitacora}`);
export const createComentario = (data) => api.post('/comentarios', data);
export const marcarLeidos = (id_bitacora) => api.patch(`/comentarios/${id_bitacora}/leidos`);
export const deleteComentario = (id_comentario) => api.delete(`/comentarios/${id_comentario}`);
export const updateComentario = (id_comentario, data) => api.put(`/comentarios/${id_comentario}`, data);
