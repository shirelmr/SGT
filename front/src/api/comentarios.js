import api from './axios';
export const getComentarios = (id_bitacora) => api.get(`/comentarios/${id_bitacora}`);
export const createComentario = (data) => api.post('/comentarios', data);
export const marcarLeidos = (id_bitacora) => api.patch(`/comentarios/${id_bitacora}/leidos`);
