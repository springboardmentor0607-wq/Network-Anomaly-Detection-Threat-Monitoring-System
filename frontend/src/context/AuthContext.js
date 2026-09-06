import React, { createContext, useState, useEffect } from 'react';
import api from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('netshield_token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem('netshield_token');
      if (savedToken) {
        try {
          const res = await api.get('/auth/me');
          setUser(res.data.user);
        } catch (err) {
          console.error("Token verification failed:", err);
          logout();
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { token, user } = res.data;
    localStorage.setItem('netshield_token', token);
    localStorage.setItem('netshield_user', JSON.stringify(user));
    setToken(token);
    setUser(user);
    return user;
  };

  const register = async (name, email, password, confirm_password) => {
    const res = await api.post('/auth/register', { name, email, password, confirm_password });
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('netshield_token');
    localStorage.removeItem('netshield_user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
