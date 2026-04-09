import api from './axios';
export const login = (email, password) => api.post('/auth/login', { email, password });
