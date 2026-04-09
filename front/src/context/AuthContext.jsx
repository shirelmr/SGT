import { createContext, useState, useEffect, useCallback } from 'react';
import { login as loginApi } from '../api/auth';

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

  // const login = useCallback(async (email, password) => {
  //   const res = await loginApi(email, password);
  //   const { token, user } = res.data;
  //   localStorage.setItem('token', token);
  //   localStorage.setItem('user', JSON.stringify(user));
  //   localStorage.setItem('rol', user.rol);
  //   setToken(token);
  //   setUser(user);
  //   setRol(user.rol);
  //   return user;
  // }, []);

  const login = useCallback(async (email, password) => {
  const roles = { 'coordinador@test.com': 'coordinador', 'tutor@test.com': 'tutor', 'revisor@test.com': 'revisor', 'beneficiario@test.com': 'beneficiario' };
  const rol = roles[email] || 'coordinador';
  const fakeUser = { id_usuario: 1, nombre_completo: 'Test User', email, rol };
  const fakeToken = 'fake-token';
  localStorage.setItem('token', fakeToken);
  localStorage.setItem('user', JSON.stringify(fakeUser));
  localStorage.setItem('rol', fakeUser.rol);
  setUser(fakeUser);
  setRol(fakeUser.rol);
  setToken(fakeToken);
  return fakeUser;
}, []);

  const logout = useCallback(() => {
    localStorage.clear();
    setToken(null);
    setUser(null);
    setRol(null);
  }, []);

  const isAuthenticated = Boolean(token);

  return (
    <AuthContext.Provider value={{ user, rol, token, isAuthenticated, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}
