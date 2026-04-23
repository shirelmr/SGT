import { createContext, useState, useEffect, useCallback } from 'react';
import { login as loginApi, register as registerApi } from '../api/auth';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [rol, setRol] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    const storedRol = localStorage.getItem('rol');
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      setRol(storedRol);
    }
    setLoading(false);
  }, []);

  const _storeSession = (tkn, usr) => {
    localStorage.setItem('token', tkn);
    localStorage.setItem('user', JSON.stringify(usr));
    localStorage.setItem('rol', usr.rol);
    setToken(tkn);
    setUser(usr);
    setRol(usr.rol);
  };

  const login = useCallback(async (email, password) => {
    const res = await loginApi(email, password);
    const { token, user } = res.data;
    _storeSession(token, user);
    return user;
  }, []);

  const register = useCallback(async (data) => {
    const res = await registerApi(data);
    const { token, user } = res.data;
    _storeSession(token, user);
    return user;
  }, []);

  const logout = useCallback(() => {
    localStorage.clear();
    setToken(null);
    setUser(null);
    setRol(null);
  }, []);

  const isAuthenticated = Boolean(token);

  return (
    <AuthContext.Provider value={{ user, rol, token, isAuthenticated, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}
